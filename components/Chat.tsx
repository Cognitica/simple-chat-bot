import { useConversations } from "@/hooks/useConversations";
import { Message, useChat } from "@ai-sdk/react";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { isMobileDevice } from "@/utils/deviceDetection";

interface ChatProps {
  conversationId: string;
  onMessageChange: (messages: Message[]) => void;
}

// Separate Chat that will be unmounted and remounted when conversation changes
export const Chat = ({ conversationId, onMessageChange }: ChatProps) => {
  const { conversations, updateConversation } = useConversations();
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the current conversation
  const conversation = conversations.find((conv) => conv.id === conversationId);

  // Initialize chat with the conversation's messages
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalSubmit,
    isLoading,
  } = useChat({
    id: conversationId,
    initialMessages: conversation?.messages || [],
    api: "/api/chat",
  });

  // Custom submit handler to refocus input after submission
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      originalSubmit(e);
      // Use setTimeout to ensure this happens after the form submission is processed
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    },
    [originalSubmit]
  );

  // Keep track of previous loading state to detect when it changes
  const prevLoadingRef = useRef(isLoading);

  // Focus input after response is received
  useEffect(() => {
    // If loading just finished (was loading, now it's not)
    if (prevLoadingRef.current && !isLoading) {
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    // Update the ref with current loading state
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  // Update conversation in storage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      updateConversation(conversationId, messages);
      onMessageChange(messages);
    }
  }, [conversationId, messages, updateConversation, onMessageChange]);

  // Focus input on component mount and when messages update
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoading, messages.length]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-8 pb-24 space-y-4 h-full">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center space-y-4 max-w-md px-4">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-lg lg:text-xl font-semibold text-[var(--foreground)]">
                Welcome to the Chat!
              </h2>
              <p className="text-sm lg:text-base text-gray-500">
                I&apos;m your AI assistant powered by Cognitica. Feel free to
                ask me anything!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] lg:max-w-[80%] rounded-2xl px-3 lg:px-4 py-2 ${
                    message.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-none"
                      : "bg-[var(--card)] text-[var(--card-foreground)] rounded-bl-none"
                  } animate-fade-in`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="whitespace-pre-wrap break-words overflow-wrap-anywhere text-sm lg:text-base"
                          >
                            {part.text}
                          </div>
                        );
                    }
                  })}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[90%] lg:max-w-[80%] rounded-2xl px-3 lg:px-4 py-2 bg-[var(--card)] text-[var(--card-foreground)] rounded-bl-none animate-fade-in">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-4 fixed-bottom-input">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] px-4 py-2 lg:text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            value={input}
            placeholder="Type your message..."
            onChange={handleInputChange}
            disabled={isLoading}
            autoFocus={!isMobileDevice()}
          />
          <button
            type="submit"
            className={`rounded-full bg-[var(--accent)] text-white px-4 lg:px-6 py-2 text-sm lg:text-base hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-all ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </button>
        </form>
      </div>
    </>
  );
};
