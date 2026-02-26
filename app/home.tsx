import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { extractKeywords } from "../constants/keywords";
import { theme } from "../constants/theme";
import { ProvinceData, supabase } from "../lib/supabase";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  data?: ProvinceData[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "สวัสดีครับ ฟ้ามืดยินดีรับใช้ คุณต้องการรู้อะไรเกี่ยวกับจังหวัดประเทศไทยไหมครับ ฟ้ามืดยินดีตอบครับ",
      isBot: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    const { category, province } = extractKeywords(inputText);

    if (category && province) {
      try {
        const { data, error } = await supabase
          .from("suratthani")
          .select("*")
          .ilike("category", `%${category}%`)
          .ilike("province", `%${province}%`);

        if (error) throw error;

        if (data && data.length > 0) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `ฟ้ามืดแนะนำ "${category}" ในจังหวัด${province} ครับ`,
            isBot: true,
            data: data,
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `ขออภัยฟ้ามืด ไม่พบข้อมูล "${category}" ในจังหวัด${province} ครับ`,
            isBot: true,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "ขออภัยฟ้ามืด เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง",
          isBot: true,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } else {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'ฟ้ามืดไม่เข้าใจคำถามครับ กรุณาลองถามใหม่โดยระบุจังหวัดและหมวดหมู่ เช่น "มีสถานที่เที่ยวไหนในจังหวัดสุราษฎร์ธานี"',
        isBot: true,
      };
      setMessages((prev) => [...prev, botMessage]);
    }

    setIsLoading(false);
  };

  const handleItemClick = (item: ProvinceData) => {
    router.push({
      pathname: "/detail",
      params: { id: item.id.toString() },
    });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ฟ้ามืด</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((message) => (
          <View key={message.id}>
            <View
              style={[
                styles.messageBubble,
                message.isBot ? styles.botBubble : styles.userBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
            {message.data && message.data.length > 0 && (
              <View style={styles.resultsContainer}>
                {message.data.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultCard}
                    onPress={() => handleItemClick(item)}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.resultImage}
                      contentFit="cover"
                    />
                    <Text style={styles.resultName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultCategory}>{item.category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="พิมพ์ข้อความ..."
          placeholderTextColor={theme.colors.textLight}
          multiline
          maxLength={500}
          onFocus={() =>
            setTimeout(
              () => scrollViewRef.current?.scrollToEnd({ animated: true }),
              100,
            )
          }
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>ส่ง</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  messagesContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  messagesContent: {
    paddingBottom: theme.spacing.lg,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  botBubble: {
    backgroundColor: theme.colors.white,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  resultsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  resultCard: {
    width: "48%",
    margin: "1%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultImage: {
    width: "100%",
    height: 120,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    padding: theme.spacing.sm,
    paddingBottom: 2,
  },
  resultCategory: {
    fontSize: 12,
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    minWidth: 60,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.primaryLight,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
