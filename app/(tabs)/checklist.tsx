import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useHousehold } from '@/contexts/HouseholdContext';
import { MessageCircle, Send, Bot } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatbotScreen() {
  const { currentHousehold } = useHousehold();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your emergency preparedness assistant. I can help you with disaster readiness, emergency planning, and answer questions about your household\'s preparedness status. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText.trim()),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hurricane') || input.includes('storm')) {
      return 'Hurricane preparedness is crucial! Make sure you have a 3-day supply of water (1 gallon per person per day), non-perishable food, flashlights, batteries, and a battery-powered radio. Secure outdoor items and know your evacuation routes.';
    } else if (input.includes('earthquake')) {
      return 'For earthquake preparedness, secure heavy furniture to walls, create a family emergency plan, and practice "Drop, Cover, and Hold On." Keep emergency supplies in multiple locations and ensure everyone knows how to turn off utilities.';
    } else if (input.includes('fire') || input.includes('wildfire')) {
      return 'Wildfire preparedness includes creating defensible space around your home, having an evacuation plan, and keeping important documents in a fireproof container. Install smoke detectors and keep fire extinguishers accessible.';
    } else if (input.includes('flood')) {
      return 'Flood preparedness involves knowing your flood risk, having sandbags ready, elevating important items, and having a "go bag" with essential supplies. Never walk or drive through floodwaters.';
    } else if (input.includes('checklist') || input.includes('supplies')) {
      return 'Your emergency checklist should include: water (1 gallon per person per day for 3 days), non-perishable food, first aid kit, flashlight with extra batteries, battery-powered radio, medications, important documents, and cash.';
    } else if (input.includes('plan') || input.includes('planning')) {
      return 'Create a family emergency plan that includes: meeting places, emergency contacts, evacuation routes, and communication methods. Practice your plan regularly and make sure everyone knows what to do.';
    } else if (input.includes('help') || input.includes('what can you do')) {
      return 'I can help you with disaster preparedness, emergency planning, supply checklists, evacuation procedures, and answer questions about specific hazards. What would you like to know more about?';
    } else {
      return 'I understand you\'re asking about emergency preparedness. I can help with disaster readiness, emergency planning, supply checklists, and specific hazard information. Could you be more specific about what you\'d like to know?';
    }
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.botMessage]}>
      <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.botText]}>
          {message.text}
              </Text>
            </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bot size={24} color="#354eab" />
          <Text style={styles.title}>Emergency Assistant</Text>
        </View>
        {currentHousehold && (
          <Text style={styles.householdName}>{currentHousehold.name}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {isTyping && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Text style={[styles.messageText, styles.botText]}>Typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about emergency preparedness..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  householdName: {
    fontSize: 16,
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#354eab',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#1f2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: '#354eab',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});