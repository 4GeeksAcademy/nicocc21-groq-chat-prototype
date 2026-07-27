import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="container">
      <header>
        <h1>🤖 Groq Chat</h1>
        <span className="badge">Prototype</span>
      </header>
      <Chat />
    </div>
  );
}
