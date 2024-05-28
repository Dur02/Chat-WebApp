import React, { useCallback, useState } from "react";
import {
  Container,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Stack,
  Box,
  InputAdornment,
} from "@mui/material";
import ArrowCircleUpOutlinedIcon from "@mui/icons-material/ArrowCircleUpOutlined";
import AdbIcon from "@mui/icons-material/Adb";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LoopIcon from "@mui/icons-material/Loop";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import "./App.css";

interface Message {
  text: string;
  from: string;
  id: number;
}

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(async () => {
    // 当没有已存在请求且input不为空时继续
    if (!loading && input.trim()) {
      setLoading(true);
      const userMessage = {
        text: input,
        from: "user",
        id: messages.length + 1,
      };
      setMessages([...messages, userMessage]);
      setInput("");
      let result = "";

      // 进行请求
      fetchEventSource("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 加上apiKey
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [...messages, userMessage].map((m) => ({
            role: m.from === "bot" ? "assistant" : "user",
            content: m.text,
          })),
          // 确保启用流式传输
          stream: true,
        }),
        // 后台运作时也启用fetch
        openWhenHidden: true,
        onmessage(msg) {
          if (msg.data && msg.data !== "[DONE]") {
            const data = JSON.parse(msg.data);
            const content = data.choices[0]?.delta?.content;
            result += content;
            // 添加id避免每次都新增一个新的数组项，覆盖掉旧的
            const botMessage = {
              text: result,
              from: "bot",
              id: messages.length + 1,
            };
            setMessages([...messages, userMessage, botMessage]);
          }
        },
        onclose() {
          setLoading(false);
        },
        onerror(err) {
          // 此处处理各种错误，例如密钥错误,响应超时等，并加上提示，取消请求等等，此处省略
          setLoading(false);
          throw err;
        },
      });
    }
  }, [input, messages, apiKey, loading]);

  // 处理回车键按下事件
  const handleEnter = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key === "Enter") {
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Container>
      <Stack direction="column" sx={{ height: "100vh" }}>
        <Box>
          <TextField
            required
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            autoComplete="off"
            sx={{
              margin: "10px 0",
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
          />
        </Box>
        <Box
          className="QABlock"
          sx={{
            flexGrow: 1,
            overflow: "auto",
            margin: "0",
          }}
        >
          <List>
            {messages.map((msg, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    {msg.from === "bot" ? <AdbIcon /> : <AccountBoxIcon />}
                  </Avatar>
                </ListItemAvatar>
                {msg.from === "bot" ? (
                  <ListItemText>
                    {/* 可以自定code样式，此次只用基础 */}
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </ListItemText>
                ) : (
                  <p>{msg.text}</p>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
        <Box>
          <TextField
            required
            multiline
            maxRows={4}
            value={input}
            placeholder="给“ChatGPT”发送消息"
            onChange={(e) => setInput(e.target.value)}
            disabled={apiKey === ""}
            fullWidth
            autoComplete="off"
            onKeyDown={(ev) => handleEnter(ev)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {/* 没有找到类似icon，此处代替 */}
                  {loading ? (
                    <LoopIcon
                      sx={{ color: input !== "" ? "#1876D2" : "#757575" }}
                    />
                  ) : (
                    <ArrowCircleUpOutlinedIcon
                      sx={{ color: input !== "" ? "#1876D2" : "#757575" }}
                      onClick={handleSend}
                    />
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              margin: "10px 0",
              overflow: "hidden",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#F3F6F9",
                borderRadius: "10px",
                "&:hover fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.23)", // 设置悬停时边框颜色
                  borderWidth: "1px", // 设置悬停时边框宽度
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.23)", // 设置聚焦时边框颜色
                  borderWidth: "1px", // 设置聚焦时边框宽度
                },
              },
            }}
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default App;
