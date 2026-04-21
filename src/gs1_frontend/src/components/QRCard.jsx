import { QRCodeCanvas } from "qrcode.react";

export default function QRCard({ item }) {

  const { codigoQR, gtin, lote, serie, fecha, dominio } = item;

  // Descargar imagen
  const downloadQR = () => {
    const canvas = document.getElementById("qr-" + codigoQR);
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `QR_${gtin}_${serie}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.card}>
      <QRCodeCanvas
        id={"qr-" + codigoQR}
        value={codigoQR}
        size={160}
        level="H"
        includeMargin={true}
      />

      <div style={styles.info}>
        <p><strong>Dominio:</strong> {item.dominio}</p>
        <p><strong>GTIN:</strong> {gtin}</p>
        <p><strong>Lote:</strong> {lote}</p>
        <p><strong>Serie:</strong> {serie}</p>
        <p style={styles.gs1}><strong>Data Link:</strong> {codigoQR}</p>
        <p><strong>Fecha:</strong> {new Date(Number(fecha) / 1_000_000).toLocaleString()}</p>
      </div>

      <button style={styles.button} onClick={downloadQR}>
        ⬇️ Descargar QR
      </button>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ccc",
    padding: "12px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "210px",
    margin: "10px",
    background: "#fff",
  },
  info: {
    marginTop: "10px",
    fontSize: "14px",
    textAlign: "left",
    width: "100%",
  },
  button: {
    marginTop: "10px",
    padding: "6px 10px",
    cursor: "pointer",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px"
  },
    gs1: {
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-all",
    fontSize: "13px",
    lineHeight: "1.2em"
  },
};
