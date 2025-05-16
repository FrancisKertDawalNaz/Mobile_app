import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function HomeScreen() {
  const [showProfile, setShowProfile] = useState(false);
  const [points, setPoints] = useState(100); // Example points value

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Subnetting Basics',
      description: 'Learn how to divide networks into smaller subnets',
      icon: '🌐',
      level: 'beginner'
    },
    {
      id: '2',
      title: 'Routing Protocols',
      description: 'Understand how data packets find their way through networks',
      icon: '🛣️',
      level: 'intermediate'
    },
    {
      id: '3',
      title: 'DNS Resolution',
      description: 'Master the Domain Name System and how it works',
      icon: '🔍',
      level: 'intermediate'
    },
    {
      id: '4',
      title: 'Network Security',
      description: 'Learn about firewalls, VPNs, and security protocols',
      icon: '🔒',
      level: 'advanced'
    }
  ];

  const quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Subnetting Quiz',
      description: 'Test your subnetting knowledge',
      questionCount: 10,
      difficulty: 'medium'
    },
    {
      id: '2',
      title: 'Routing Basics',
      description: 'Basic routing concepts and protocols',
      questionCount: 10,
      difficulty: 'easy'
    },
    {
      id: '3',
      title: 'Network Security',
      description: 'Security protocols and best practices',
      questionCount: 10,
      difficulty: 'hard'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CD964';
      case 'medium':
        return '#FF9500';
      case 'hard':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CD964';
      case 'intermediate':
        return '#FF9500';
      case 'advanced':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout pressed');
    setShowProfile(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Network Learning Simulator</Text>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.profileIcon}>
            <Text style={styles.profileIconText}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Tutorials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tutorialsContainer}>
            {tutorials.map((tutorial) => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => router.push(`/tutorial/${tutorial.id}`)}
              >
                <Text style={styles.tutorialIcon}>{tutorial.icon}</Text>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(tutorial.level) }]}>
                  <Text style={styles.levelText}>{tutorial.level}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Quizzes</Text>
          {quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => router.push(`/quiz/${quiz.id}`)}
            >
              <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quiz.difficulty) }]}>
                  <Text style={styles.difficultyText}>{quiz.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.quizDescription}>{quiz.description}</Text>
              <Text style={styles.questionCount}>{quiz.questionCount} questions</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Simulator</Text>
          <TouchableOpacity
            style={styles.simulatorCard}
            onPress={() => router.push('/simulator')}
          >
            <Text style={styles.simulatorTitle}>Packet Transfer Simulation</Text>
            <Text style={styles.simulatorDescription}>
              Visualize how data packets travel through a network
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={showProfile} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Profile</Text>
            <Text style={styles.pointsText}>Points: {points}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowProfile(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 20,
  },
  profileIcon: {
    padding: 10,
    marginLeft: -40,
  },
  profileIconText: {
    fontSize: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tutorialsContainer: {
    marginBottom: 20,
  },
  tutorialCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 15,
    marginRight: 15,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorialIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quizCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  questionCount: {
    fontSize: 12,
    color: '#999',
  },
  simulatorCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simulatorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  simulatorDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 18,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 