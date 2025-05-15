import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Canvas, Circle, Line, Group } from '@shopify/react-native-skia';

interface NetworkNode {
  id: string;
  type: 'router' | 'switch' | 'host';
  label: string;
  x: number;
  y: number;
  connections: string[];
  status: 'active' | 'inactive';
}

interface Packet {
  id: string;
  source: string;
  destination: string;
  data: string;
  path: string[];
  currentPosition: number;
  status: 'moving' | 'delivered' | 'dropped';
}

const initialNodes: NetworkNode[] = [
  { id: 'R1', type: 'router', label: 'Router 1', x: 100, y: 100, connections: ['S1', 'R2'], status: 'active' },
  { id: 'R2', type: 'router', label: 'Router 2', x: 300, y: 100, connections: ['R1', 'S2'], status: 'active' },
  { id: 'S1', type: 'switch', label: 'Switch 1', x: 100, y: 250, connections: ['R1', 'H1', 'H2'], status: 'active' },
  { id: 'S2', type: 'switch', label: 'Switch 2', x: 300, y: 250, connections: ['R2', 'H3', 'H4'], status: 'active' },
  { id: 'H1', type: 'host', label: 'Host 1', x: 50, y: 400, connections: ['S1'], status: 'active' },
  { id: 'H2', type: 'host', label: 'Host 2', x: 150, y: 400, connections: ['S1'], status: 'active' },
  { id: 'H3', type: 'host', label: 'Host 3', x: 250, y: 400, connections: ['S2'], status: 'active' },
  { id: 'H4', type: 'host', label: 'Host 4', x: 350, y: 400, connections: ['S2'], status: 'active' },
];

const findPath = (source: string, destination: string, nodes: NetworkNode[]): string[] => {
  const queue: string[][] = [[source]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    if (current === destination) {
      return path;
    }

    const currentNode = nodes.find(n => n.id === current);
    if (!currentNode) continue;

    for (const connection of currentNode.connections) {
      if (!visited.has(connection)) {
        visited.add(connection);
        queue.push([...path, connection]);
      }
    }
  }

  return [];
};

export default function SimulatorScreen() {
  const { type, domain } = useLocalSearchParams();
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms
  const [isSimulating, setIsSimulating] = useState(false);

  const handleNodePress = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const sendPacket = (source: string, destination: string, data: string) => {
    const path = findPath(source, destination, nodes);
    if (path.length === 0) return;

    const newPacket: Packet = {
      id: `p${Date.now()}`,
      source,
      destination,
      data,
      path,
      currentPosition: 0,
      status: 'moving',
    };

    setPackets(prev => [...prev, newPacket]);
  };

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPackets(prev => {
        return prev.map(packet => {
          if (packet.status !== 'moving') return packet;

          const newPosition = packet.currentPosition + 1;
          if (newPosition >= packet.path.length) {
            return { ...packet, status: 'delivered' };
          }

          return { ...packet, currentPosition: newPosition };
        });
      });
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'router': return '#FF9500';
      case 'switch': return '#34C759';
      case 'host': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getNodeRadius = (type: string) => {
    switch (type) {
      case 'router': return 30;
      case 'switch': return 25;
      case 'host': return 20;
      default: return 15;
    }
  };

  const renderConnections = () => {
    return nodes.map(node => (
      node.connections.map(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return null;

        return (
          <Line
            key={`${node.id}-${targetId}`}
            p1={{ x: node.x, y: node.y }}
            p2={{ x: targetNode.x, y: targetNode.y }}
            color="#8E8E93"
            strokeWidth={2}
          />
        );
      })
    ));
  };

  const renderNodes = () => {
    return nodes.map(node => (
      <Group key={node.id}>
        <Circle
          cx={node.x}
          cy={node.y}
          r={getNodeRadius(node.type)}
          color={getNodeColor(node.type)}
        />
      </Group>
    ));
  };

  const renderPackets = () => {
    return packets.map(packet => {
      if (packet.status !== 'moving') return null;

      const currentPathIndex = packet.currentPosition;
      const nextPathIndex = packet.currentPosition + 1;
      if (nextPathIndex >= packet.path.length) return null;

      const currentNode = nodes.find(n => n.id === packet.path[currentPathIndex]);
      const nextNode = nodes.find(n => n.id === packet.path[nextPathIndex]);
      if (!currentNode || !nextNode) return null;

      const progress = (Date.now() % simulationSpeed) / simulationSpeed;
      const x = currentNode.x + (nextNode.x - currentNode.x) * progress;
      const y = currentNode.y + (nextNode.y - currentNode.y) * progress;

      return (
        <Circle
          key={packet.id}
          cx={x}
          cy={y}
          r={5}
          color="#FF3B30"
        />
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Network Simulator</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isSimulating && styles.activeButton]}
            onPress={() => setIsSimulating(!isSimulating)}
          >
            <Text style={styles.controlButtonText}>
              {isSimulating ? 'Stop' : 'Start'} Simulation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (selectedNode) {
                const source = selectedNode;
                const destination = nodes.find(n => n.type === 'host' && n.id !== source)?.id;
                if (destination) {
                  sendPacket(source, destination, 'Test Data');
                }
              }
            }}
            disabled={!selectedNode}
          >
            <Text style={styles.controlButtonText}>Send Packet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.simulationArea}
        onPress={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          // Find the closest node within a certain radius
          const node = nodes.find(n => {
            const dx = n.x - locationX;
            const dy = n.y - locationY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= getNodeRadius(n.type);
          });
          if (node) {
            handleNodePress(node.id);
          }
        }}
      >
        <Canvas style={{ flex: 1 }}>
          {renderConnections()}
          {renderNodes()}
          {renderPackets()}
        </Canvas>
        {/* Render node labels using React Native Text components */}
        {nodes.map(node => (
          <Text
            key={`label-${node.id}`}
            style={[
              styles.nodeLabel,
              {
                position: 'absolute',
                left: node.x - 20,
                top: node.y + getNodeRadius(node.type) + 5,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: 2,
                borderRadius: 4,
                fontSize: 12,
                textAlign: 'center',
                width: 40,
              }
            ]}
          >
            {node.label}
          </Text>
        ))}
      </TouchableOpacity>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>Network Information</Text>
        {selectedNode && (
          <View style={styles.nodeInfo}>
            <Text style={styles.nodeInfoText}>
              Selected: {nodes.find(n => n.id === selectedNode)?.label}
            </Text>
            <Text style={styles.nodeInfoText}>
              Type: {nodes.find(n => n.id === selectedNode)?.type}
            </Text>
            <Text style={styles.nodeInfoText}>
              Status: {nodes.find(n => n.id === selectedNode)?.status}
            </Text>
          </View>
        )}
        <Text style={styles.infoTitle}>Active Packets: {packets.filter(p => p.status === 'moving').length}</Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  simulationArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoPanel: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  nodeInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  nodeInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  nodeLabel: {
    position: 'absolute',
    left: 0,
    top: 0,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 2,
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'center',
    width: 40,
  },
}); 