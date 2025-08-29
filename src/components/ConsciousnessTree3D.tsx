'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

interface TreeNode3D {
  id: string
  position: [number, number, number]
  level: number
  type: 'awareness' | 'wisdom' | 'creativity' | 'connection'
  title: string
  unlocked: boolean
  progress: number
  connections: string[]
}

interface ConsciousnessTree3DProps {
  currentDay: number
  completedTasks: string[]
  className?: string
}

// 树节点组件
function TreeNode({ 
  node, 
  onClick 
}: { 
  node: TreeNode3D
  onClick: (node: TreeNode3D) => void 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      if (hovered) {
        meshRef.current.scale.setScalar(1.2)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })

  const getNodeColor = (type: string, unlocked: boolean) => {
    if (!unlocked) return '#666666'
    switch (type) {
      case 'awareness': return '#fbbf24'
      case 'wisdom': return '#8b5cf6'
      case 'creativity': return '#10b981'
      case 'connection': return '#f472b6'
      default: return '#6b7280'
    }
  }

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[0.3, 16, 16]}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={getNodeColor(node.type, node.unlocked)}
          emissive={getNodeColor(node.type, node.unlocked)}
          emissiveIntensity={node.unlocked ? 0.2 : 0}
          transparent
          opacity={node.unlocked ? 1 : 0.3}
        />
      </Sphere>
      
      {/* 进度环 */}
      {node.unlocked && node.progress < 100 && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[0.35, 0.4, 32]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}

      {/* 节点标题 */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.title}
      </Text>

      {/* 粒子效果 */}
      {node.unlocked && (
        <ParticleSystem color={getNodeColor(node.type, true)} />
      )}
    </group>
  )
}

// 粒子系统组件
function ParticleSystem({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(50 * 3)
    for (let i = 0; i < 50; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return positions
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={color}
        transparent
        opacity={0.6}
      />
    </points>
  )
}

// 连接线组件
function TreeConnections({ nodes }: { nodes: TreeNode3D[] }) {
  const connections = useMemo(() => {
    const lines: Array<{ start: [number, number, number], end: [number, number, number] }> = []
    
    nodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const targetNode = nodes.find(n => n.id === connectionId)
        if (targetNode) {
          lines.push({
            start: node.position,
            end: targetNode.position
          })
        }
      })
    })
    
    return lines
  }, [nodes])

  return (
    <>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={[connection.start, connection.end]}
          color="#8b5cf6"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  )
}

// 主场景组件
function TreeScene({
  currentDay,
  completedTasks
}: {
  currentDay: number
  completedTasks: string[]
}) {
  // completedTasks will be used for future functionality
  console.log('Completed tasks count:', completedTasks.length);
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
  }, [camera])

  // 生成3D树节点
  const generateTree3DNodes = (): TreeNode3D[] => {
    const nodes: TreeNode3D[] = []
    
    // 根节点
    nodes.push({
      id: 'root',
      position: [0, 0, 0],
      level: 0,
      type: 'awareness',
      title: '觉醒种子',
      unlocked: true,
      progress: 100,
      connections: []
    })

    // 第一层 - 基础觉察
    if (currentDay >= 3) {
      const firstLevel = [
        { id: 'awareness-1', title: '初始觉察', type: 'awareness' as const, position: [-2, 2, 0] as [number, number, number] },
        { id: 'awareness-2', title: '内观开启', type: 'awareness' as const, position: [2, 2, 0] as [number, number, number] },
      ]
      
      firstLevel.forEach(node => {
        nodes.push({
          ...node,
          level: 1,
          unlocked: currentDay >= 3,
          progress: Math.min(100, ((currentDay - 3) / 4) * 100),
          connections: ['root']
        })
      })
    }

    // 第二层 - 智慧萌芽
    if (currentDay >= 7) {
      const secondLevel = [
        { id: 'wisdom-1', title: '智慧萌芽', type: 'wisdom' as const, position: [0, 4, -2] as [number, number, number] },
        { id: 'wisdom-2', title: '洞察深化', type: 'wisdom' as const, position: [0, 4, 2] as [number, number, number] },
      ]
      
      secondLevel.forEach(node => {
        nodes.push({
          ...node,
          level: 2,
          unlocked: currentDay >= 7,
          progress: Math.min(100, ((currentDay - 7) / 7) * 100),
          connections: ['awareness-1', 'awareness-2']
        })
      })
    }

    // 第三层 - 创造力绽放
    if (currentDay >= 14) {
      const thirdLevel = [
        { id: 'creativity-1', title: '创造之花', type: 'creativity' as const, position: [-3, 6, 0] as [number, number, number] },
        { id: 'creativity-2', title: '灵感涌现', type: 'creativity' as const, position: [3, 6, 0] as [number, number, number] },
      ]
      
      thirdLevel.forEach(node => {
        nodes.push({
          ...node,
          level: 3,
          unlocked: currentDay >= 14,
          progress: Math.min(100, ((currentDay - 14) / 7) * 100),
          connections: ['wisdom-1', 'wisdom-2']
        })
      })
    }

    // 第四层 - 连接共振
    if (currentDay >= 21) {
      nodes.push({
        id: 'connection-1',
        position: [0, 8, 0],
        level: 4,
        type: 'connection',
        title: '共振之果',
        unlocked: currentDay >= 21,
        progress: Math.min(100, ((currentDay - 21) / 9) * 100),
        connections: ['creativity-1', 'creativity-2']
      })
    }

    return nodes
  }

  const nodes = generateTree3DNodes()

  const handleNodeClick = (node: TreeNode3D) => {
    console.log('Clicked node:', node)
    // 这里可以添加节点点击的交互逻辑
  }

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} />
      
      {/* 主光源 */}
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* 辅助光源 */}
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

      {/* 树节点 */}
      {nodes.map(node => (
        <TreeNode key={node.id} node={node} onClick={handleNodeClick} />
      ))}

      {/* 连接线 */}
      <TreeConnections nodes={nodes} />

      {/* 控制器 */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={20}
        minDistance={5}
      />
    </>
  )
}

export default function ConsciousnessTree3D({
  currentDay,
  completedTasks,
  className = ''
}: ConsciousnessTree3DProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`w-full h-96 rounded-2xl overflow-hidden ${className} bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">加载3D意识树...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-96 rounded-2xl overflow-hidden ${className}`}>
      <Canvas>
        <TreeScene currentDay={currentDay} completedTasks={completedTasks} />
      </Canvas>
    </div>
  )
}
