import { ChatOllama } from "@langchain/ollama";
const model = new ChatOllama({
    model: 'gemma3:4b',
    streaming: true
});
export const message = async (socket) => {
    socket.on('chat-with-llm', async (data) => {
        try {
            const stream = await model.stream([
                ["human", data.content]
            ]);
            let buffer = '';
            let timer = null;
            const flushBuffer = () => {
                if (buffer) {
                    socket.emit('llm-response-chunk', { chunk: buffer });
                    buffer = '';
                }
            };
            for await (const chunk of stream) {
                buffer += chunk?.content || '';
                if (!timer) {
                    timer = setTimeout(() => {
                        flushBuffer();
                        timer = null;
                    }, 100); // Flush every 100ms
                }
            }
            // Final flush after stream ends
            flushBuffer();
            socket.emit('llm-response-end');
        }
        catch (error) {
            console.error("Error generated", error);
            socket.emit('llm-response-error', {
                error: error
            });
        }
    });
};
