import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import QrPage from "./pages/QrPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<QrPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;