import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';

interface NetworkNode {
  id: string;
  type: 'router' | 'switch' | 'host';
  label: string;
  x: number;
  y: number;
  connections: string[];
  status: 'active' | 'inactive' | 'error';
  ip?: string;
  bandwidth?: number;
  latency?: number;
  packetLoss?: number;
}

interface Packet {
  id: string;
  source: string;
  destination: string;
  data: string;
  path: string[];
  currentPosition: number;
  status: 'moving' | 'delivered' | 'dropped';
  type: 'TCP' | 'UDP' | 'ICMP';
  timestamp: number;
}

interface NetworkStats {
  totalPackets: number;
  successfulPackets: number;
  droppedPackets: number;
  averageLatency: number;
  bandwidthUsage: number;
  packetTypes: {
    TCP: number;
    UDP: number;
    ICMP: number;
  };
  nodeStats: {
    [key: string]: {
      packetsReceived: number;
      packetsSent: number;
      bandwidthUsage: number;
      averageLatency: number;
    };
  };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  bandwidth: number;
  latency: number;
  packetLoss: number;
  status: 'active' | 'inactive';
}

interface SimulationScenario {
  name: string;
  description: string;
  setup: (nodes: NetworkNode[], connections: Connection[]) => {
    nodes: NetworkNode[];
    connections: Connection[];
    packetFilters: { [key: string]: { allowedTypes: ('TCP' | 'UDP' | 'ICMP')[]; maxBandwidth: number; priority: number; } };
  };
}

interface NetworkConfig {
  nodes: NetworkNode[];
  connections: Connection[];
  packetFilters: { [key: string]: { allowedTypes: ('TCP' | 'UDP' | 'ICMP')[]; maxBandwidth: number; priority: number; } };
  name: string;
  description: string;
  date: string;
}

const initialNodes: NetworkNode[] = [
  { 
    id: 'R1', 
    type: 'router', 
    label: 'Router 1', 
    x: 100, 
    y: 100, 
    connections: ['S1', 'R2'], 
    status: 'active',
    ip: '192.168.1.1',
    bandwidth: 1000,
    latency: 5,
    packetLoss: 0.1
  },
  { 
    id: 'R2', 
    type: 'router', 
    label: 'Router 2', 
    x: 300, 
    y: 100, 
    connections: ['R1', 'S2'], 
    status: 'active',
    ip: '192.168.1.2',
    bandwidth: 1000,
    latency: 5,
    packetLoss: 0.1
  },
  { 
    id: 'S1', 
    type: 'switch', 
    label: 'Switch 1', 
    x: 100, 
    y: 250, 
    connections: ['R1', 'H1', 'H2'], 
    status: 'active',
    ip: '192.168.1.3',
    bandwidth: 100,
    latency: 1,
    packetLoss: 0.05
  },
  { 
    id: 'S2', 
    type: 'switch', 
    label: 'Switch 2', 
    x: 300, 
    y: 250, 
    connections: ['R2', 'H3', 'H4'], 
    status: 'active',
    ip: '192.168.1.4',
    bandwidth: 100,
    latency: 1,
    packetLoss: 0.05
  },
  { 
    id: 'H1', 
    type: 'host', 
    label: 'Host 1', 
    x: 50, 
    y: 400, 
    connections: ['S1'], 
    status: 'active',
    ip: '192.168.1.5',
    bandwidth: 10,
    latency: 0.5,
    packetLoss: 0
  },
  { 
    id: 'H2', 
    type: 'host', 
    label: 'Host 2', 
    x: 150, 
    y: 400, 
    connections: ['S1'], 
    status: 'active',
    ip: '192.168.1.6',
    bandwidth: 10,
    latency: 0.5,
    packetLoss: 0
  },
  { 
    id: 'H3', 
    type: 'host', 
    label: 'Host 3', 
    x: 250, 
    y: 400, 
    connections: ['S2'], 
    status: 'active',
    ip: '192.168.1.7',
    bandwidth: 10,
    latency: 0.5,
    packetLoss: 0
  },
  { 
    id: 'H4', 
    type: 'host', 
    label: 'Host 4', 
    x: 350, 
    y: 400, 
    connections: ['S2'], 
    status: 'active',
    ip: '192.168.1.8',
    bandwidth: 10,
    latency: 0.5,
    packetLoss: 0
  },
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

const tutorialSteps = [
  {
    title: 'Welcome to Network Simulator',
    content: 'This simulator helps you understand network concepts through interactive visualization.',
  },
  {
    title: 'Network Components',
    content: 'The network consists of Routers (orange), Switches (green), and Hosts (blue). Each has different capabilities and roles.',
  },
  {
    title: 'Sending Packets',
    content: 'Select a node and choose a packet type (TCP, UDP, or ICMP) to send data through the network.',
  },
  {
    title: 'Monitoring',
    content: 'Watch the network statistics to understand packet delivery, latency, and bandwidth usage.',
  },
  {
    title: 'Configuration',
    content: 'Click on any node to configure its properties like IP address, bandwidth, and latency.',
  },
];

const networkTopologies = {
  star: {
    name: 'Star Network',
    description: 'All nodes connect to a central hub (router)',
    create: () => {
      const nodes: NetworkNode[] = [];
      const centerX = 200;
      const centerY = 200;
      const radius = 150;

      // Create central router
      nodes.push({
        id: 'R1',
        type: 'router',
        label: 'Router 1',
        x: centerX,
        y: centerY,
        connections: [],
        status: 'active',
        ip: '192.168.1.1',
        bandwidth: 1000,
        latency: 5,
        packetLoss: 0.1
      });

      // Create surrounding nodes
      const nodeTypes: ('switch' | 'host')[] = ['switch', 'switch', 'host', 'host', 'host', 'host'];
      nodeTypes.forEach((type, index) => {
        const angle = (index * 2 * Math.PI) / nodeTypes.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const nodeId = type === 'switch' ? `S${index + 1}` : `H${index + 1}`;
        
        nodes.push({
          id: nodeId,
          type,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
          x,
          y,
          connections: ['R1'],
          status: 'active',
          ip: `192.168.1.${index + 2}`,
          bandwidth: type === 'switch' ? 100 : 10,
          latency: type === 'switch' ? 1 : 0.5,
          packetLoss: type === 'switch' ? 0.05 : 0
        });
      });

      // Update router connections
      nodes[0].connections = nodes.slice(1).map(n => n.id);

      return nodes;
    }
  },
  mesh: {
    name: 'Mesh Network',
    description: 'All nodes are interconnected',
    create: () => {
      const nodes: NetworkNode[] = [];
      const centerX = 200;
      const centerY = 200;
      const radius = 150;

      // Create nodes in a circle
      const nodeTypes: ('router' | 'switch' | 'host')[] = ['router', 'router', 'switch', 'switch', 'host', 'host'];
      nodeTypes.forEach((type, index) => {
        const angle = (index * 2 * Math.PI) / nodeTypes.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const nodeId = type === 'router' ? `R${index + 1}` : type === 'switch' ? `S${index + 1}` : `H${index + 1}`;
        
        nodes.push({
          id: nodeId,
          type,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
          x,
          y,
          connections: [],
          status: 'active',
          ip: `192.168.1.${index + 1}`,
          bandwidth: type === 'router' ? 1000 : type === 'switch' ? 100 : 10,
          latency: type === 'router' ? 5 : type === 'switch' ? 1 : 0.5,
          packetLoss: type === 'router' ? 0.1 : type === 'switch' ? 0.05 : 0
        });
      });

      // Connect all nodes to each other
      nodes.forEach((node, i) => {
        node.connections = nodes
          .filter((_, j) => i !== j)
          .map(n => n.id);
      });

      return nodes;
    }
  },
  bus: {
    name: 'Bus Network',
    description: 'All nodes connect to a single backbone',
    create: () => {
      const nodes: NetworkNode[] = [];
      const startX = 50;
      const spacing = 100;

      // Create backbone router
      nodes.push({
        id: 'R1',
        type: 'router',
        label: 'Router 1',
        x: startX,
        y: 200,
        connections: [],
        status: 'active',
        ip: '192.168.1.1',
        bandwidth: 1000,
        latency: 5,
        packetLoss: 0.1
      });

      // Create nodes along the bus
      const nodeTypes: ('switch' | 'host')[] = ['switch', 'host', 'switch', 'host', 'host', 'host'];
      nodeTypes.forEach((type, index) => {
        const x = startX + spacing * (index + 1);
        const y = 200 + (index % 2 === 0 ? -50 : 50);
        const nodeId = type === 'switch' ? `S${index + 1}` : `H${index + 1}`;
        
        nodes.push({
          id: nodeId,
          type,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
          x,
          y,
          connections: ['R1'],
          status: 'active',
          ip: `192.168.1.${index + 2}`,
          bandwidth: type === 'switch' ? 100 : 10,
          latency: type === 'switch' ? 1 : 0.5,
          packetLoss: type === 'switch' ? 0.05 : 0
        });
      });

      // Update router connections
      nodes[0].connections = nodes.slice(1).map(n => n.id);

      return nodes;
    }
  }
};

const simulationScenarios = {
  normal: {
    name: 'Normal Operation',
    description: 'All nodes and connections operating normally',
    setup: (nodes, connections) => ({
      nodes: nodes.map(node => ({ ...node, status: 'active' })),
      connections: connections.map(conn => ({ ...conn, status: 'active' })),
      packetFilters: {}
    })
  },
  congestion: {
    name: 'Network Congestion',
    description: 'Simulates high traffic causing delays and packet loss',
    setup: (nodes, connections) => ({
      nodes: nodes.map(node => ({
        ...node,
        status: 'active',
        latency: node.latency * 3,
        packetLoss: node.packetLoss * 2
      })),
      connections: connections.map(conn => ({
        ...conn,
        status: 'active',
        latency: conn.latency * 3,
        packetLoss: conn.packetLoss * 2,
        bandwidth: conn.bandwidth * 0.5
      })),
      packetFilters: {}
    })
  },
  failure: {
    name: 'Node Failure',
    description: 'Simulates critical node failures',
    setup: (nodes, connections) => {
      // Find routers and switches
      const criticalNodes = nodes.filter(n => n.type === 'router' || n.type === 'switch');
      // Randomly select 2 critical nodes to fail
      const failedNodes = criticalNodes.sort(() => Math.random() - 0.5).slice(0, 2);
      
      return {
        nodes: nodes.map(node => ({
          ...node,
          status: failedNodes.some(n => n.id === node.id) ? 'inactive' : 'active'
        })),
        connections: connections.map(conn => ({
          ...conn,
          status: failedNodes.some(n => n.id === conn.from || n.id === conn.to) ? 'inactive' : 'active'
        })),
        packetFilters: {}
      };
    }
  },
  security: {
    name: 'Security Measures',
    description: 'Implements strict packet filtering and bandwidth limits',
    setup: (nodes, connections) => ({
      nodes: nodes.map(node => ({
        ...node,
        status: 'active',
        bandwidth: node.bandwidth * 0.7
      })),
      connections: connections.map(conn => ({
        ...conn,
        status: 'active',
        bandwidth: conn.bandwidth * 0.7
      })),
      packetFilters: nodes.reduce((filters, node) => ({
        ...filters,
        [node.id]: {
          allowedTypes: node.type === 'router' ? ['TCP', 'UDP', 'ICMP'] :
                       node.type === 'switch' ? ['TCP', 'UDP'] : ['TCP'],
          maxBandwidth: node.bandwidth * 0.7,
          priority: node.type === 'router' ? 3 : node.type === 'switch' ? 2 : 1
        }
      }), {})
    })
  }
};

export default function SimulatorScreen() {
  const { type, domain } = useLocalSearchParams();
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms
  const [isSimulating, setIsSimulating] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalPackets: 0,
    successfulPackets: 0,
    droppedPackets: 0,
    averageLatency: 0,
    bandwidthUsage: 0,
    packetTypes: {
      TCP: 0,
      UDP: 0,
      ICMP: 0
    },
    nodeStats: {}
  });
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [packetType, setPacketType] = useState<'TCP' | 'UDP' | 'ICMP'>('TCP');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [newNodeType, setNewNodeType] = useState<'router' | 'switch' | 'host'>('host');
  const [newNodeIp, setNewNodeIp] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [showConnectionConfig, setShowConnectionConfig] = useState(false);
  const [packetFilters, setPacketFilters] = useState<{
    [key: string]: {
      allowedTypes: ('TCP' | 'UDP' | 'ICMP')[];
      maxBandwidth: number;
      priority: number;
    }
  }>({});
  const [showPacketFilters, setShowPacketFilters] = useState(false);
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  const [showTopologyMenu, setShowTopologyMenu] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showSaveLoadMenu, setShowSaveLoadMenu] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<NetworkConfig[]>([]);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleNodePress = (nodeId: string) => {
    if (selectedNode) {
      // If a node is already selected, create a connection
      if (selectedNode !== nodeId) {
        const newConnection: Connection = {
          id: `C${connections.length + 1}`,
          from: selectedNode,
          to: nodeId,
          bandwidth: 100,
          latency: 1,
          packetLoss: 0.05,
          status: 'active'
        };
        setConnections(prev => [...prev, newConnection]);
        
        // Update node connections
        setNodes(prev => prev.map(node => {
          if (node.id === selectedNode) {
            return { ...node, connections: [...node.connections, nodeId] };
          }
          if (node.id === nodeId) {
            return { ...node, connections: [...node.connections, selectedNode] };
          }
          return node;
        }));
      }
      setSelectedNode(null);
    } else {
      setSelectedNode(nodeId);
    }
  };

  const handleConnectionPress = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setShowConnectionConfig(true);
  };

  const updateConnection = (connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
  };

  const updatePacketFilter = (nodeId: string, updates: {
    allowedTypes?: ('TCP' | 'UDP' | 'ICMP')[];
    maxBandwidth?: number;
    priority?: number;
  }) => {
    setPacketFilters(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updates
      }
    }));
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
      type: packetType,
      timestamp: Date.now()
    };

    setPackets(prev => [...prev, newPacket]);
    updateNetworkStats(newPacket);
  };

  const updateNetworkStats = (packet: Packet) => {
    setNetworkStats(prev => {
      const newStats = { ...prev };
      newStats.totalPackets++;
      newStats.packetTypes[packet.type]++;

      // Update node stats
      if (!newStats.nodeStats[packet.source]) {
        newStats.nodeStats[packet.source] = {
          packetsSent: 0,
          packetsReceived: 0,
          bandwidthUsage: 0,
          averageLatency: 0
        };
      }
      if (!newStats.nodeStats[packet.destination]) {
        newStats.nodeStats[packet.destination] = {
          packetsSent: 0,
          packetsReceived: 0,
          bandwidthUsage: 0,
          averageLatency: 0
        };
      }

      newStats.nodeStats[packet.source].packetsSent++;
      newStats.nodeStats[packet.destination].packetsReceived++;

      // Calculate latency and bandwidth
      const connection = connections.find(c => 
        (c.from === packet.source && c.to === packet.destination) ||
        (c.from === packet.destination && c.to === packet.source)
      );

      if (connection) {
        const latency = connection.latency;
        newStats.nodeStats[packet.source].averageLatency = 
          (newStats.nodeStats[packet.source].averageLatency * (newStats.nodeStats[packet.source].packetsSent - 1) + latency) / 
          newStats.nodeStats[packet.source].packetsSent;
        
        newStats.nodeStats[packet.source].bandwidthUsage += connection.bandwidth;
      }

      // Update overall stats
      newStats.averageLatency = Object.values(newStats.nodeStats).reduce((acc, node) => acc + node.averageLatency, 0) / 
        Object.keys(newStats.nodeStats).length;
      
      newStats.bandwidthUsage = Object.values(newStats.nodeStats).reduce((acc, node) => acc + node.bandwidthUsage, 0);

      return newStats;
    });
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

  const renderNode = (node: NetworkNode) => {
    const radius = getNodeRadius(node.type);
    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.node,
          {
            left: node.x - radius,
            top: node.y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            backgroundColor: getNodeColor(node.type),
            borderWidth: 2,
            borderColor: getStatusColor(node.status)
          }
        ]}
        onPress={() => {
          setSelectedNode(node.id);
          setShowNodeConfig(true);
        }}
      >
        <Text style={styles.nodeLabel}>{node.label}</Text>
        <Text style={styles.nodeIp}>{node.ip}</Text>
      </TouchableOpacity>
    );
  };

  const renderConnection = (node: NetworkNode, targetId: string) => {
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return null;

    const startX = node.x;
    const startY = node.y;
    const endX = targetNode.x;
    const endY = targetNode.y;

    return (
      <View
        key={`${node.id}-${targetId}`}
        style={[
          styles.connection,
          {
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
            transform: [
              { rotate: `${Math.atan2(endY - startY, endX - startX)}rad` }
            ]
          }
        ]}
      />
    );
  };

  const renderPacket = (packet: Packet) => {
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
      <View
        key={packet.id}
        style={[
          styles.packet,
          {
            left: x - 5,
            top: y - 5,
          }
        ]}
      />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#8E8E93';
      case 'error': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderNetworkStats = () => (
    <Modal
      visible={showNetworkStats}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Network Statistics</Text>
          
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Packets</Text>
                <Text style={styles.statValue}>{networkStats.totalPackets}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Successful Packets</Text>
                <Text style={styles.statValue}>{networkStats.successfulPackets}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Dropped Packets</Text>
                <Text style={styles.statValue}>{networkStats.droppedPackets}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average Latency</Text>
                <Text style={styles.statValue}>{networkStats.averageLatency.toFixed(2)} ms</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bandwidth Usage</Text>
                <Text style={styles.statValue}>{networkStats.bandwidthUsage.toFixed(2)} Mbps</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Packet Types</Text>
            <View style={styles.statsGrid}>
              {Object.entries(networkStats.packetTypes).map(([type, count]) => (
                <View key={type} style={styles.statItem}>
                  <Text style={styles.statLabel}>{type}</Text>
                  <Text style={styles.statValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Node Statistics</Text>
            {Object.entries(networkStats.nodeStats).map(([nodeId, stats]) => {
              const node = nodes.find(n => n.id === nodeId);
              return (
                <View key={nodeId} style={styles.nodeStats}>
                  <Text style={styles.nodeStatsTitle}>{node?.label}</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Packets Sent</Text>
                      <Text style={styles.statValue}>{stats.packetsSent}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Packets Received</Text>
                      <Text style={styles.statValue}>{stats.packetsReceived}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Bandwidth Usage</Text>
                      <Text style={styles.statValue}>{stats.bandwidthUsage.toFixed(2)} Mbps</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Average Latency</Text>
                      <Text style={styles.statValue}>{stats.averageLatency.toFixed(2)} ms</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowNetworkStats(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNodeConfig = () => (
    <Modal
      visible={showNodeConfig}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Node Configuration</Text>
          {selectedNode && (
            <ScrollView style={styles.configScroll}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>IP Address</Text>
                <TextInput
                  style={styles.configInput}
                  value={nodes.find(n => n.id === selectedNode)?.ip}
                  onChangeText={(text) => {
                    setNodes(prev => prev.map(n => 
                      n.id === selectedNode ? { ...n, ip: text } : n
                    ));
                  }}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Bandwidth (Mbps)</Text>
                <TextInput
                  style={styles.configInput}
                  value={nodes.find(n => n.id === selectedNode)?.bandwidth?.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    setNodes(prev => prev.map(n => 
                      n.id === selectedNode ? { ...n, bandwidth: parseInt(text) || 0 } : n
                    ));
                  }}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Latency (ms)</Text>
                <TextInput
                  style={styles.configInput}
                  value={nodes.find(n => n.id === selectedNode)?.latency?.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    setNodes(prev => prev.map(n => 
                      n.id === selectedNode ? { ...n, latency: parseFloat(text) || 0 } : n
                    ));
                  }}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Packet Loss (%)</Text>
                <TextInput
                  style={styles.configInput}
                  value={nodes.find(n => n.id === selectedNode)?.packetLoss?.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    setNodes(prev => prev.map(n => 
                      n.id === selectedNode ? { ...n, packetLoss: parseFloat(text) || 0 } : n
                    ));
                  }}
                />
              </View>
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowNodeConfig(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTutorial = () => (
    <Modal
      visible={showTutorial}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{tutorialSteps[tutorialStep].title}</Text>
          <Text style={styles.tutorialContent}>{tutorialSteps[tutorialStep].content}</Text>
          <View style={styles.tutorialButtons}>
            {tutorialStep > 0 && (
              <TouchableOpacity
                style={[styles.tutorialButton, styles.secondaryButton]}
                onPress={() => setTutorialStep(prev => prev - 1)}
              >
                <Text style={styles.tutorialButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            {tutorialStep < tutorialSteps.length - 1 ? (
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => setTutorialStep(prev => prev + 1)}
              >
                <Text style={styles.tutorialButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => {
                  setShowTutorial(false);
                  setTutorialStep(0);
                }}
              >
                <Text style={styles.tutorialButtonText}>Finish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddNode = () => (
    <Modal
      visible={showAddNode}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Node</Text>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Node Type</Text>
            <View style={styles.nodeTypeButtons}>
              {(['router', 'switch', 'host'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.nodeTypeButton,
                    newNodeType === type && styles.selectedNodeType
                  ]}
                  onPress={() => setNewNodeType(type)}
                >
                  <Text style={[
                    styles.nodeTypeButtonText,
                    newNodeType === type && styles.selectedNodeTypeText
                  ]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>IP Address</Text>
            <TextInput
              style={styles.configInput}
              value={newNodeIp}
              onChangeText={setNewNodeIp}
              placeholder="Enter IP address"
            />
          </View>
          <View style={styles.addNodeButtons}>
            <TouchableOpacity
              style={[styles.addNodeButton, styles.secondaryButton]}
              onPress={() => setShowAddNode(false)}
            >
              <Text style={styles.addNodeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addNodeButton}
              onPress={() => {
                const newNode: NetworkNode = {
                  id: `N${nodes.length + 1}`,
                  type: newNodeType,
                  label: `${newNodeType.charAt(0).toUpperCase() + newNodeType.slice(1)} ${nodes.length + 1}`,
                  x: 200,
                  y: 200,
                  connections: [],
                  status: 'active',
                  ip: newNodeIp,
                  bandwidth: newNodeType === 'router' ? 1000 : newNodeType === 'switch' ? 100 : 10,
                  latency: newNodeType === 'router' ? 5 : newNodeType === 'switch' ? 1 : 0.5,
                  packetLoss: newNodeType === 'router' ? 0.1 : newNodeType === 'switch' ? 0.05 : 0
                };
                setNodes(prev => [...prev, newNode]);
                setShowAddNode(false);
                setNewNodeIp('');
              }}
            >
              <Text style={styles.addNodeButtonText}>Add Node</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderConnections = () => {
    return connections.map(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      if (!fromNode || !toNode) return null;

      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const length = Math.sqrt(
        Math.pow(toNode.x - fromNode.x, 2) + Math.pow(toNode.y - fromNode.y, 2)
      );

      return (
        <TouchableOpacity
          key={connection.id}
          onPress={() => handleConnectionPress(connection.id)}
          style={[
            styles.connection,
            {
              width: length,
              left: fromNode.x,
              top: fromNode.y,
              transform: [{ rotate: `${angle}rad` }],
              backgroundColor: connection.status === 'active' ? '#4CAF50' : '#9E9E9E'
            }
          ]}
        />
      );
    });
  };

  const renderConnectionConfig = () => (
    <Modal
      visible={showConnectionConfig}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Connection Configuration</Text>
          {selectedConnection && (
            <>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Status</Text>
                <View style={styles.statusButtons}>
                  {(['active', 'inactive'] as const).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        connections.find(c => c.id === selectedConnection)?.status === status && styles.selectedStatus
                      ]}
                      onPress={() => updateConnection(selectedConnection, { status })}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        connections.find(c => c.id === selectedConnection)?.status === status && styles.selectedStatusText
                      ]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Bandwidth (Mbps)</Text>
                <TextInput
                  style={styles.configInput}
                  value={connections.find(c => c.id === selectedConnection)?.bandwidth?.toString() || '0'}
                  onChangeText={(value) => updateConnection(selectedConnection, { bandwidth: Number(value) })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Latency (ms)</Text>
                <TextInput
                  style={styles.configInput}
                  value={connections.find(c => c.id === selectedConnection)?.latency?.toString() || '0'}
                  onChangeText={(value) => updateConnection(selectedConnection, { latency: Number(value) })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Packet Loss (%)</Text>
                <TextInput
                  style={styles.configInput}
                  value={((connections.find(c => c.id === selectedConnection)?.packetLoss || 0) * 100).toString()}
                  onChangeText={(value) => updateConnection(selectedConnection, { packetLoss: Number(value) / 100 })}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowConnectionConfig(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPacketFilters = () => (
    <Modal
      visible={showPacketFilters}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Packet Filters</Text>
          {nodes.map(node => (
            <View key={node.id} style={styles.filterItem}>
              <Text style={styles.filterLabel}>{node.label}</Text>
              <View style={styles.filterOptions}>
                <Text style={styles.filterSubLabel}>Allowed Packet Types:</Text>
                {(['TCP', 'UDP', 'ICMP'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterTypeButton,
                      packetFilters[node.id]?.allowedTypes?.includes(type) && styles.selectedFilterType
                    ]}
                    onPress={() => {
                      const currentTypes = packetFilters[node.id]?.allowedTypes || [];
                      const newTypes = currentTypes.includes(type)
                        ? currentTypes.filter(t => t !== type)
                        : [...currentTypes, type];
                      updatePacketFilter(node.id, { allowedTypes: newTypes });
                    }}
                  >
                    <Text style={[
                      styles.filterTypeText,
                      packetFilters[node.id]?.allowedTypes?.includes(type) && styles.selectedFilterTypeText
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.filterOptions}>
                <Text style={styles.filterSubLabel}>Max Bandwidth (Mbps):</Text>
                <TextInput
                  style={styles.filterInput}
                  value={packetFilters[node.id]?.maxBandwidth?.toString()}
                  onChangeText={(value) => updatePacketFilter(node.id, { maxBandwidth: Number(value) })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.filterOptions}>
                <Text style={styles.filterSubLabel}>Priority:</Text>
                <TextInput
                  style={styles.filterInput}
                  value={packetFilters[node.id]?.priority?.toString()}
                  onChangeText={(value) => updatePacketFilter(node.id, { priority: Number(value) })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPacketFilters(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const applyTopology = (topology: keyof typeof networkTopologies) => {
    const newNodes = networkTopologies[topology].create();
    setNodes(newNodes);
    setConnections([]);
    setShowTopologyMenu(false);
  };

  const renderTopologyMenu = () => (
    <Modal
      visible={showTopologyMenu}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Network Topologies</Text>
          {Object.entries(networkTopologies).map(([key, topology]) => (
            <TouchableOpacity
              key={key}
              style={styles.topologyItem}
              onPress={() => applyTopology(key as keyof typeof networkTopologies)}
            >
              <Text style={styles.topologyName}>{topology.name}</Text>
              <Text style={styles.topologyDescription}>{topology.description}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTopologyMenu(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const applyScenario = (scenario: keyof typeof simulationScenarios) => {
    const { nodes: newNodes, connections: newConnections, packetFilters: newFilters } = 
      simulationScenarios[scenario].setup(nodes, connections);
    
    setNodes(newNodes);
    setConnections(newConnections);
    setPacketFilters(newFilters);
    setShowScenarioMenu(false);
  };

  const renderScenarioMenu = () => (
    <Modal
      visible={showScenarioMenu}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Simulation Scenarios</Text>
          {Object.entries(simulationScenarios).map(([key, scenario]) => (
            <TouchableOpacity
              key={key}
              style={styles.scenarioItem}
              onPress={() => applyScenario(key as keyof typeof simulationScenarios)}
            >
              <Text style={styles.scenarioName}>{scenario.name}</Text>
              <Text style={styles.scenarioDescription}>{scenario.description}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowScenarioMenu(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const saveCurrentConfig = () => {
    const newConfig: NetworkConfig = {
      nodes,
      connections,
      packetFilters,
      name: configName,
      description: configDescription,
      date: new Date().toISOString()
    };

    setSavedConfigs(prev => [...prev, newConfig]);
    setConfigName('');
    setConfigDescription('');
    setShowSaveDialog(false);
  };

  const loadConfig = (config: NetworkConfig) => {
    setNodes(config.nodes);
    setConnections(config.connections);
    setPacketFilters(config.packetFilters);
    setShowSaveLoadMenu(false);
  };

  const deleteConfig = (configName: string) => {
    setSavedConfigs(prev => prev.filter(c => c.name !== configName));
  };

  const renderSaveLoadMenu = () => (
    <Modal
      visible={showSaveLoadMenu}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Save/Load Configuration</Text>
          
          <View style={styles.saveLoadButtons}>
            <TouchableOpacity
              style={styles.saveLoadButton}
              onPress={() => setShowSaveDialog(true)}
            >
              <Text style={styles.saveLoadButtonText}>Save Current</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.savedConfigsList}>
            <Text style={styles.savedConfigsTitle}>Saved Configurations</Text>
            {savedConfigs.map(config => (
              <View key={config.name} style={styles.savedConfigItem}>
                <View style={styles.savedConfigInfo}>
                  <Text style={styles.savedConfigName}>{config.name}</Text>
                  <Text style={styles.savedConfigDescription}>{config.description}</Text>
                  <Text style={styles.savedConfigDate}>
                    {new Date(config.date).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.savedConfigActions}>
                  <TouchableOpacity
                    style={[styles.savedConfigButton, styles.loadButton]}
                    onPress={() => loadConfig(config)}
                  >
                    <Text style={styles.savedConfigButtonText}>Load</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.savedConfigButton, styles.deleteButton]}
                    onPress={() => deleteConfig(config.name)}
                  >
                    <Text style={styles.savedConfigButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSaveLoadMenu(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSaveDialog = () => (
    <Modal
      visible={showSaveDialog}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Save Configuration</Text>
          
          <View style={styles.configInput}>
            <Text style={styles.configLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={configName}
              onChangeText={setConfigName}
              placeholder="Enter configuration name"
            />
          </View>

          <View style={styles.configInput}>
            <Text style={styles.configLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={configDescription}
              onChangeText={setConfigDescription}
              placeholder="Enter configuration description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.saveDialogButtons}>
            <TouchableOpacity
              style={[styles.saveDialogButton, styles.cancelButton]}
              onPress={() => {
                setShowSaveDialog(false);
                setConfigName('');
                setConfigDescription('');
              }}
            >
              <Text style={styles.saveDialogButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveDialogButton, styles.saveButton]}
              onPress={saveCurrentConfig}
              disabled={!configName.trim()}
            >
              <Text style={styles.saveDialogButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
            onPress={() => setShowTutorial(true)}
          >
            <Text style={styles.controlButtonText}>Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowAddNode(true)}
          >
            <Text style={styles.controlButtonText}>Add Node</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowPacketFilters(true)}
          >
            <Text style={styles.controlButtonText}>Packet Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowNetworkStats(true)}
          >
            <Text style={styles.controlButtonText}>Network Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowTopologyMenu(true)}
          >
            <Text style={styles.controlButtonText}>Topologies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowScenarioMenu(true)}
          >
            <Text style={styles.controlButtonText}>Scenarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSaveLoadMenu(true)}
          >
            <Text style={styles.controlButtonText}>Save/Load</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.packetTypeContainer}>
        <Text style={styles.packetTypeLabel}>Packet Type:</Text>
        <View style={styles.packetTypeButtons}>
          {(['TCP', 'UDP', 'ICMP'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.packetTypeButton,
                packetType === type && styles.selectedPacketType
              ]}
              onPress={() => setPacketType(type)}
            >
              <Text style={[
                styles.packetTypeButtonText,
                packetType === type && styles.selectedPacketTypeText
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.simulationArea}
        onPress={(event) => {
          const { locationX, locationY } = event.nativeEvent;
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
        <View style={styles.networkContainer}>
          {nodes.map(node => node.connections.map(targetId => renderConnection(node, targetId)))}
          {nodes.map(renderNode)}
          {packets.map(renderPacket)}
        </View>
      </TouchableOpacity>

      {renderNetworkStats()}
      {renderNodeConfig()}
      {renderTutorial()}
      {renderAddNode()}
      {renderConnections()}
      {renderConnectionConfig()}
      {renderPacketFilters()}
      {renderTopologyMenu()}
      {renderScenarioMenu()}
      {renderSaveLoadMenu()}
      {renderSaveDialog()}

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
    flexWrap: 'wrap',
    gap: 10,
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
  networkContainer: {
    flex: 1,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  connection: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4CAF50',
  },
  packet: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
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
  statsContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  configScroll: {
    maxHeight: 300,
  },
  configItem: {
    marginBottom: 15,
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  configInput: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  packetTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  packetTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  packetTypeButtons: {
    flexDirection: 'row',
  },
  packetTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedPacketType: {
    backgroundColor: '#007AFF',
  },
  packetTypeButtonText: {
    color: '#666',
    fontSize: 12,
  },
  selectedPacketTypeText: {
    color: '#fff',
  },
  nodeIp: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  tutorialContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  tutorialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tutorialButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  tutorialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nodeTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  nodeTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  selectedNodeType: {
    backgroundColor: '#007AFF',
  },
  nodeTypeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  selectedNodeTypeText: {
    color: '#fff',
  },
  addNodeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  addNodeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  addNodeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  selectedStatus: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    color: '#666',
    fontSize: 14,
  },
  selectedStatusText: {
    color: '#fff',
  },
  filterItem: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterOptions: {
    marginBottom: 10,
  },
  filterTypeButton: {
    padding: 5,
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
    marginRight: 5,
    marginBottom: 5,
  },
  selectedFilterType: {
    backgroundColor: '#007AFF',
  },
  filterTypeText: {
    color: '#666',
    fontSize: 12,
  },
  selectedFilterTypeText: {
    color: '#fff',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    fontSize: 14,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  nodeStats: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  nodeStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  topologyItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  topologyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  topologyDescription: {
    fontSize: 14,
    color: '#666',
  },
  scenarioItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveLoadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  saveLoadButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  saveLoadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedConfigsList: {
    marginBottom: 20,
  },
  savedConfigsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  savedConfigItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  savedConfigInfo: {
    marginBottom: 10,
  },
  savedConfigName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  savedConfigDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  savedConfigDate: {
    fontSize: 12,
    color: '#999',
  },
  savedConfigActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  savedConfigButton: {
    padding: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  loadButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  savedConfigButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  configInput: {
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  saveDialogButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveDialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 