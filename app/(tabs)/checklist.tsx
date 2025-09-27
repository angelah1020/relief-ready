import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHousehold } from '@/contexts/HouseholdContext';
import { MessageCircle, Send, Bot } from 'lucide-react-native';
import { emergencyChatbot, ChatMessage } from '@/services/gemini/chatbot';

// Use ChatMessage from the service instead of local interface

export default function ChatbotScreen() {
  const { currentHousehold } = useHousehold();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m ReadyBot, your emergency preparedness assistant. I can help you navigate the Relief Ready app and answer disaster preparedness questions. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Animated values for typing dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  // Animation effect for typing dots
  useEffect(() => {
    if (isTyping) {
      const createAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 800,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = createAnimation(dot1Opacity, 0);
      const animation2 = createAnimation(dot2Opacity, 300);
      const animation3 = createAnimation(dot3Opacity, 600);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
      };
    } else {
      // Reset dots when not typing
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    }
  }, [isTyping, dot1Opacity, dot2Opacity, dot3Opacity]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Add longer typing delay for more realistic feel
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // 2-4 seconds
      
      const context = {
        household: currentHousehold ? {
          name: currentHousehold.name,
          country: currentHousehold.country,
          postalCode: currentHousehold.zip_code,
          memberCount: 0, // This would need to be fetched from members
          petCount: 0, // This would need to be fetched from pets
          riskProfile: (currentHousehold as any).risk_profile || []
        } : undefined,
        currentScreen: 'Chatbot'
      };
      const response = await emergencyChatbot.generateResponse(inputText.trim(), context);
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m having trouble connecting right now. Please try again in a moment.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };


  const renderMessage = (message: ChatMessage) => (
    <View key={message.id} style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.botMessage]}>
      <Text style={[styles.senderName, message.isUser ? styles.userSenderName : styles.botSenderName]}>
        {message.isUser ? 'You' : 'ReadyBot'}
      </Text>
      <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.botText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#354eab', '#a8bafe']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bot size={24} color="#ffffff" />
          <Text style={styles.title}>ReadyBot</Text>
        </View>
        {currentHousehold && (
          <Text style={styles.householdName}>{currentHousehold.name}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}
        {isTyping && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <Text style={[styles.senderName, styles.botSenderName]}>
              ReadyBot
            </Text>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.typingContainer}>
                <Text style={[styles.messageText, styles.botText, styles.typingText]}>ReadyBot is typing</Text>
                <View style={styles.typingDots}>
                  <Animated.Text style={[styles.typingDot, { opacity: dot1Opacity }]}>.</Animated.Text>
                  <Animated.Text style={[styles.typingDot, { opacity: dot2Opacity }]}>.</Animated.Text>
                  <Animated.Text style={[styles.typingDot, { opacity: dot3Opacity }]}>.</Animated.Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me something!"
          placeholderTextColor="#6b7280"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    color: '#ffffff',
    marginLeft: 8,
  },
  householdName: {
    fontSize: 16,
    color: '#ffffff',
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
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  userSenderName: {
    color: '#354eab',
    textAlign: 'right',
  },
  botSenderName: {
    color: '#ffffff',
    textAlign: 'left',
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
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderWidth: 1,
    borderColor: '#354eab',
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
    color: '#354eab',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    minHeight: 56,
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
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  typingDot: {
    fontSize: 16,
    color: '#6b7280',
    marginHorizontal: 1,
  },
});