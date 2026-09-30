import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@design/styles.css";
import "./styles.css";
import { useRoute } from "./lib/format";
import { Library } from "./pages/Library";
import { MeetingPage } from "./pages/MeetingPage";
import { NewMeeting } from "./pages/NewMeeting";
import { Viewer } from "./pages/Viewer";

function App() {
  const { parts, query } = useRoute();
  if (parts[0] === "view" && parts[1]) return <Viewer token={parts[1]} />;
  if (parts[0] === "new") return <NewMeeting query={query} />;
  if (parts[0] === "m" && parts[1]) return <MeetingPage key={parts[1]} id={parts[1]} at={query.get("at")} />;
  return <Library />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
