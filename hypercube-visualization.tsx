"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Growth stages for each layer
const GROWTH_STAGES = [
  "Boundary Set",
  "Authenticity Embraced",
  "Self-Advocacy",
  "Resilience Built",
  "Transformation Complete",
]

// CSS styles to prevent selection and other unwanted behaviors
const preventSelectionStyle = {
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  KhtmlUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
  userSelect: "none",
  touchAction: "none",
  outline: "none",
}

export default function HypercubeVisualization() {
  const [highContrast, setHighContrast] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const canvasContainerRef = useRef(null)

  // Prevent default behaviors on the container
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const preventDefault = (e) => {
      e.preventDefault()
      return false
    }

    // Add event listeners to prevent unwanted behaviors
    container.addEventListener("contextmenu", preventDefault)
    container.addEventListener("selectstart", preventDefault)

    return () => {
      // Clean up event listeners
      container.removeEventListener("contextmenu", preventDefault)
      container.removeEventListener("selectstart", preventDefault)
    }
  }, [])

  return (
    <div
      ref={canvasContainerRef}
      className="w-full h-screen bg-gradient-radial from-[#1A1A2E] to-[#0F0F1A] flex flex-col select-none"
      style={preventSelectionStyle}
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-4 bg-black/20 backdrop-blur-sm p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
          <Label htmlFor="high-contrast" className="text-white">
            High Contrast
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          <Label htmlFor="sound-toggle" className="text-white">
            Enable Sound
          </Label>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 50 }} style={preventSelectionStyle}>
        <color attach="background" args={[highContrast ? "#000000" : "#0F0F1A"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <Scene highContrast={highContrast} soundEnabled={soundEnabled} />
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>

      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        <p>Hover to unfold the hypercube</p>
        <p>Click to reveal fractal structure</p>
      </div>
    </div>
  )
}

function Scene({ highContrast, soundEnabled }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  // Colors based on contrast mode
  const primaryColor = highContrast ? "#FFFFFF" : "#FF4D4D"
  const secondaryColor = highContrast ? "#FFFFFF" : "#4D4DFF"
  const accentColor = highContrast ? "#FFFFFF" : "#FFD700"

  // Simple audio implementation
  useEffect(() => {
    if (!soundEnabled) return

    let audioContext, oscillator, gainNode

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      audioContext = new AudioContext()
      oscillator = audioContext.createOscillator()
      gainNode = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = hovered ? 40 : 10
      gainNode.gain.value = hovered ? 0.2 : 0

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()
    } catch (e) {
      console.error("Audio error:", e)
    }

    return () => {
      try {
        if (oscillator) oscillator.stop()
        if (audioContext) audioContext.close()
      } catch (e) {
        console.error("Audio cleanup error:", e)
      }
    }
  }, [soundEnabled, hovered])

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
      rotation={[0, 0, clicked ? Math.PI / 4 : 0]}
    >
      {/* Main Tesseract */}
      <SimpleHypercube
        hovered={hovered}
        clicked={clicked}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        highContrast={highContrast}
      />
    </group>
  )
}

function SimpleHypercube({ hovered, clicked, primaryColor, secondaryColor, accentColor, highContrast }) {
  const groupRef = useRef()

  // Simple animation without useFrame to avoid cleanup issues
  useEffect(() => {
    let animationId

    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.x += 0.001
        groupRef.current.rotation.y += 0.002
      }
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  // Calculate positions based on hover state
  const getLayerPosition = (index) => {
    if (!hovered) return [0, 0, 0]
    return [0, (index - 2) * 2, 0]
  }

  // Text color based on contrast mode
  const textColor = highContrast ? "#FFFFFF" : "#FFFFFF"
  const textOutlineColor = highContrast ? "#000000" : "#000000"

  return (
    <group ref={groupRef}>
      {/* Outer cubes */}
      {GROWTH_STAGES.map((stage, index) => (
        <group key={index} position={getLayerPosition(index)}>
          <mesh>
            <boxGeometry args={[2 - index * 0.2, 2 - index * 0.2, 2 - index * 0.2]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? primaryColor : index % 3 === 1 ? secondaryColor : accentColor}
              wireframe={true}
              emissive={index % 3 === 0 ? primaryColor : index % 3 === 1 ? secondaryColor : accentColor}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Text labels - using Text component with proper error handling */}
          {hovered && (
            <TextLabel
              text={stage}
              position={[0, (2 - index * 0.2) / 2 + 0.5, 0]}
              color={textColor}
              outlineColor={textOutlineColor}
            />
          )}
        </group>
      ))}

      {/* Inner fractal structure - only when clicked */}
      {clicked && (
        <group scale={[0.5, 0.5, 0.5]}>
          {[0, 1, 2].map((level) => (
            <mesh key={`fractal-${level}`} rotation={[(level * Math.PI) / 4, (level * Math.PI) / 4, 0]}>
              <boxGeometry args={[1 - level * 0.3, 1 - level * 0.3, 1 - level * 0.3]} />
              <meshStandardMaterial
                color={accentColor}
                wireframe={true}
                emissive={accentColor}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}

          {/* Text label for fractal structure */}
          <TextLabel
            text="Fractal Self-Reclamation"
            position={[0, 1.5, 0]}
            color={textColor}
            outlineColor={textOutlineColor}
            fontSize={0.15}
          />
        </group>
      )}
    </group>
  )
}

// Separate component for text labels with error handling
function TextLabel({ text, position, color = "#FFFFFF", outlineColor = "#000000", fontSize = 0.2 }) {
  // Use a try-catch block to handle any potential errors with the Text component
  try {
    return (
      <Text
        position={position}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={outlineColor}
        renderOrder={1}
        depthTest={false} // Ensures text is always visible
      >
        {text}
      </Text>
    )
  } catch (error) {
    console.error("Error rendering text:", error)
    // Fallback to a simple mesh if Text component fails
    return (
      <mesh position={position}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    )
  }
}
