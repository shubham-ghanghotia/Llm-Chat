import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Moon, Sun, Menu, X } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function ChatGPTClone() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "Welcome to ChatGPT Clone!" },
  ]);
  const [input, setInput] = useState("");
  const [chatTitles, setChatTitles] = useState<string[]>(["New Chat"]);
  const [activeChat, setActiveChat] = useState("New Chat");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const responseMessage: Message = {
      role: "assistant",
      content: `Echo: ${input}`,
    };
    setTimeout(() => {
      setMessages((prev) => [...prev, responseMessage]);
    }, 500);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  return (
    <div
      className={clsx(
        "flex h-screen w-full overflow-hidden",
        darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-black"
      )}
    >
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={clsx(
          "fixed md:static top-0 left-0 z-40 h-full w-64",
          darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
          {chatTitles.map((title, index) => (
            <div
              key={index}
              onClick={() => setActiveChat(title)}
              className={clsx(
                "cursor-pointer p-2 rounded-md",
                activeChat === title
                  ? darkMode
                    ? "bg-gray-700"
                    : "bg-gray-200"
                  : darkMode
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-100"
              )}
            >
              {title}
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              const newTitle = `Chat ${chatTitles.length + 1}`;
              setChatTitles([...chatTitles, newTitle]);
              setActiveChat(newTitle);
              setMessages([{ role: "system", content: "New chat started." }]);
            }}
          >
            + New Chat
          </Button>
        </div>
      </motion.aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col p-4 relative z-10 w-full">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="font-semibold text-lg">{activeChat}</h1>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 mb-4 space-y-4 overflow-y-auto pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx(
                "max-w-2xl px-4 py-2 rounded-md whitespace-pre-wrap",
                msg.role === "user"
                  ? "ml-auto bg-blue-100 text-black"
                  : darkMode
                  ? "bg-gray-800"
                  : "bg-white"
              )}
            >
              {msg.content}
            </div>
          ))}
          <div ref={scrollRef} />
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            placeholder="Type your message..."
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 max-h-40 min-h-[40px] resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ overflow: "hidden" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 200) + "px";
            }}
          />
          <Button onClick={sendMessage} className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
