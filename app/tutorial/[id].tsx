import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  example?: string;
  interactive?: {
    type: 'quiz' | 'simulation' | 'calculation';
    question?: string;
    options?: string[];
    correctAnswer?: string;
  };
}

const tutorials: { [key: string]: TutorialStep[] } = {
  '1': [ // Subnetting Basics
    {
      id: 1,
      title: 'What is Subnetting?',
      content: 'Subnetting is the process of dividing a network into smaller, more manageable sub-networks. This helps in organizing and securing networks more effectively.',
      example: 'Think of it like dividing a large building into different floors and rooms.'
    },
    {
      id: 2,
      title: 'IP Addresses and Subnets',
      content: 'An IP address consists of two parts: network portion and host portion. Subnetting allows us to create multiple networks within a single network address.',
      example: '192.168.1.0/24 can be divided into 192.168.1.0/25 and 192.168.1.128/25'
    },
    {
      id: 3,
      title: 'Subnet Mask',
      content: 'A subnet mask is a 32-bit number that masks an IP address and divides it into network and host addresses.',
      interactive: {
        type: 'calculation',
        question: 'What is the subnet mask for /24?',
        correctAnswer: '255.255.255.0'
      }
    }
  ],
  '2': [ // Routing Protocols
    {
      id: 1,
      title: 'Introduction to Routing',
      content: 'Routing is the process of selecting a path for traffic in a network or between multiple networks.',
      example: 'Like a GPS system for data packets'
    },
    {
      id: 2,
      title: 'Common Routing Protocols',
      content: 'RIP, OSPF, and BGP are common routing protocols used in networks.',
      interactive: {
        type: 'quiz',
        question: 'Which protocol is used for routing between autonomous systems?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'BGP'
      }
    }
  ],
  '3': [ // DNS Resolution
    {
      id: 1,
      title: 'What is DNS?',
      content: 'DNS (Domain Name System) translates domain names into IP addresses.',
      example: 'www.example.com → 93.184.216.34'
    },
    {
      id: 2,
      title: 'DNS Resolution Process',
      content: 'Learn how DNS queries work and how they are resolved through different DNS servers.',
      interactive: {
        type: 'simulation',
        question: 'Trace the DNS resolution process for www.example.com'
      }
    }
  ],
  '4': [ // Network Security
    {
      id: 1,
      title: 'Network Security Basics',
      content: 'Learn about fundamental network security concepts and best practices.',
      example: 'Firewalls, VPNs, and encryption'
    },
    {
      id: 2,
      title: 'Common Security Threats',
      content: 'Understand different types of network attacks and how to prevent them.',
      interactive: {
        type: 'quiz',
        question: 'Which attack involves sending fake ARP messages?',
        options: ['DDoS', 'ARP Spoofing', 'SQL Injection', 'XSS'],
        correctAnswer: 'ARP Spoofing'
      }
    }
  ]
};

export default function TutorialScreen() {
  const { id } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const tutorial = tutorials[id as string] || [];
  const step = tutorial[currentStep];

  const handleNext = () => {
    if (currentStep < tutorial.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else {
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  const handleInteractive = () => {
    if (step.interactive?.type === 'quiz') {
      setShowAnswer(true);
    } else if (step.interactive?.type === 'calculation') {
      // Handle calculation input
    } else if (step.interactive?.type === 'simulation') {
      router.push(`/simulator?type=dns&domain=example.com`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{step?.title}</Text>
          <Text style={styles.progress}>Step {currentStep + 1} of {tutorial.length}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.mainContent}>{step?.content}</Text>
          
          {step?.example && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Example:</Text>
              <Text style={styles.exampleText}>{step.example}</Text>
            </View>
          )}

          {step?.interactive && (
            <View style={styles.interactiveContainer}>
              <Text style={styles.interactiveTitle}>Try it yourself:</Text>
              <Text style={styles.question}>{step.interactive.question}</Text>

              {step.interactive.type === 'quiz' && step.interactive.options && (
                <View style={styles.optionsContainer}>
                  {step.interactive.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        userAnswer === option && styles.selectedOption,
                        showAnswer && option === step.interactive?.correctAnswer && styles.correctOption
                      ]}
                      onPress={() => setUserAnswer(option)}
                      disabled={showAnswer}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!showAnswer && (
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={handleInteractive}
                >
                  <Text style={styles.checkButtonText}>Check Answer</Text>
                </TouchableOpacity>
              )}

              {showAnswer && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>
                    {userAnswer === step.interactive?.correctAnswer
                      ? 'Correct! 🎉'
                      : `Incorrect. The correct answer is: ${step.interactive?.correctAnswer}`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentStep === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>
              {currentStep === tutorial.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  progress: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  mainContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  exampleContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
  },
  interactiveContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  interactiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  question: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  correctOption: {
    borderColor: '#4CD964',
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  checkButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 