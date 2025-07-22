
export class StreamingTextResponse extends Response {
    constructor(stream: ReadableStream) {
      super(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }
  }
  