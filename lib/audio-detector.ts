import * as tf from '@tensorflow/tfjs'

// Distress classes to monitor
const DISTRESS_CLASSES = ['Screaming', 'Shout', 'Glass', 'Crash', 'Crying', 'Wail', 'Moan', 'Yell']
const CONFIDENCE_THRESHOLD = 0.80

export class YamnetAudioDetector {
  private model: tf.GraphModel | null = null
  private classMap: string[] = []
  private isRunning: boolean = false
  
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private scriptNode: ScriptProcessorNode | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  
  private onDistressDetected: (className: string, confidence: number, audioBlob?: Blob) => void

  constructor(onDistressDetected: (className: string, confidence: number, audioBlob?: Blob) => void) {
    this.onDistressDetected = onDistressDetected
  }

  async loadModel() {
    console.log('[YAMNet] Loading model from TF Hub...')
    // Load from TF Hub
    this.model = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1', { fromTFHub: true })
    
    // Fetch class map
    const response = await fetch('https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv')
    const csvText = await response.text()
    
    // Parse CSV: index,mid,display_name
    const lines = csvText.split('\n').slice(1) // Skip header
    this.classMap = lines.map(line => {
      const parts = line.split(',')
      return parts.length > 2 ? parts.slice(2).join(',').replace(/"/g, '').trim() : ''
    })
    
    console.log('[YAMNet] Model and class map loaded successfully')
  }

  async start() {
    if (!this.model) await this.loadModel()
    
    this.isRunning = true
    
    // Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Setup MediaRecorder for capturing
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: 'audio/webm' })
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data)
          // Keep only the last 10 chunks (approx 10 seconds since timeslice is 1000ms)
          if (this.audioChunks.length > 10) {
            this.audioChunks.shift()
          }
        }
      }
      this.mediaRecorder.start(1000)
    } catch (err) {
      console.warn('MediaRecorder setup failed (browser might not support webm or MediaRecorder):', err)
    }
    
    // YAMNet requires exactly 16000 Hz sample rate
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
    
    const source = this.audioContext.createMediaStreamSource(this.mediaStream)
    
    // 16384 samples at 16kHz is ~1.024 seconds of audio.
    // ScriptProcessorNode is deprecated but the easiest way to get raw PCM data synced to the audio context in vanilla JS
    this.scriptNode = this.audioContext.createScriptProcessor(16384, 1, 1)
    
    this.scriptNode.onaudioprocess = async (event) => {
      if (!this.isRunning || !this.model) return
      
      const audioData = event.inputBuffer.getChannelData(0) // Float32Array
      
      // Run inference
      // The YAMNet model expects a 1D Float32Array
      const tensor = tf.tensor1d(audioData)
      
      try {
        // Returns [scores, embeddings, spectrogram]
        const [scores, embeddings, spectrogram] = this.model.predict(tensor) as tf.Tensor[]
        
        // scores is shape [num_frames, 521]. We take the mean across frames
        const meanScores = tf.mean(scores, 0)
        const scoresData = await meanScores.data()
        
        // Find highest scoring class
        let maxScore = 0
        let maxIndex = 0
        
        for (let i = 0; i < scoresData.length; i++) {
          if (scoresData[i] > maxScore) {
            maxScore = scoresData[i]
            maxIndex = i
          }
        }
        
        const topClass = this.classMap[maxIndex]
        
        // Only log high confidence non-silence to avoid spamming console
        if (maxScore > 0.3 && topClass !== 'Silence') {
          console.log(`[YAMNet] Top sound: ${topClass} (${maxScore.toFixed(2)})`)
        }
        
        if (maxScore > CONFIDENCE_THRESHOLD) {
          // Check if it's a distress class
          const isDistress = DISTRESS_CLASSES.some(dc => topClass.toLowerCase().includes(dc.toLowerCase()))
          
          if (isDistress) {
            console.warn(`🚨 Distress detected: ${topClass} (${maxScore})`)
            
            let audioBlob: Blob | undefined;
            if (this.audioChunks.length > 0) {
              audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
            }
            
            this.onDistressDetected(topClass, maxScore, audioBlob)
            
            // Pause detection slightly to avoid spamming the backend
            this.isRunning = false
            setTimeout(() => {
              if (this.audioContext && this.audioContext.state === 'running') {
                this.isRunning = true
              }
            }, 5000)
          }
        }
        
        // Cleanup tensors to prevent memory leak
        tf.dispose([tensor, scores, embeddings, spectrogram, meanScores])
        
      } catch (err) {
        console.error('YAMNet inference error:', err)
        tensor.dispose()
      }
    }
    
    source.connect(this.scriptNode)
    // Connect to destination to trigger onaudioprocess (we mute it via gain if we actually output, but script node without output connection might not fire in some browsers)
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = 0
    this.scriptNode.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
  }

  async processAudioFile(file: File) {
    if (!this.model) await this.loadModel()
    
    this.isRunning = true
    const fileAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await fileAudioContext.decodeAudioData(arrayBuffer)
      const audioData = audioBuffer.getChannelData(0)
      
      const CHUNK_SIZE = 16384
      
      for (let i = 0; i < audioData.length; i += CHUNK_SIZE) {
        if (!this.isRunning) break
        
        const chunk = audioData.slice(i, i + CHUNK_SIZE)
        if (chunk.length < 1000) break
        
        const tensor = tf.tensor1d(chunk)
        try {
          if (!this.model) break
          const [scores, embeddings, spectrogram] = this.model.predict(tensor) as tf.Tensor[]
          const meanScores = tf.mean(scores, 0)
          const scoresData = await meanScores.data()
          
          let maxScore = 0
          let maxIndex = 0
          for (let j = 0; j < scoresData.length; j++) {
            if (scoresData[j] > maxScore) {
              maxScore = scoresData[j]
              maxIndex = j
            }
          }
          
          const topClass = this.classMap[maxIndex]
          
          if (maxScore > CONFIDENCE_THRESHOLD) {
            const isDistress = DISTRESS_CLASSES.some(dc => topClass.toLowerCase().includes(dc.toLowerCase()))
            
            if (isDistress) {
              console.warn(`🚨 Distress detected in file: ${topClass} (${maxScore})`)
              this.onDistressDetected(topClass, maxScore, file)
              
              // Prevent firing too quickly for the same event
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
          }
          
          tf.dispose([tensor, scores, embeddings, spectrogram, meanScores])
        } catch (err) {
          console.error('YAMNet file inference error:', err)
          tensor.dispose()
        }
      }
    } catch (err) {
      console.error('Error processing audio file:', err)
    } finally {
      fileAudioContext.close()
      this.isRunning = false
    }
  }

  stop() {
    this.isRunning = false
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
      this.mediaRecorder = null
    }
    this.audioChunks = []
    
    if (this.scriptNode) {
      this.scriptNode.disconnect()
      this.scriptNode = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
  }
}
