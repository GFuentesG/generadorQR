import { Outlet, Link } from "react-router-dom";
import styles from "../app.module.css";

export default function RootLayout() {
  return (
    <main className={styles.container}>
      <img src="/uma_technology.png" alt="Logo UMA" className={styles.logo} />
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/" style={{ marginRight: "1rem" }}>📱 Generación QR</Link>
      </nav>
      <Outlet />  {/* Aquí se renderiza la página activa */}
    </main>
  );
}