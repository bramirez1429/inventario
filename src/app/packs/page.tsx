"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase.config";
import {
  Select,
  InputNumber,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Space,
  message,
  Checkbox,
} from "antd";
import { ShoppingOutlined, SkinOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// 📘 Tipado exacto de Firestore
interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  tipo: "Niño" | "Niña" | "Mujer" | "Kids";
}

const coll = collection(db, "v");

// 🎨 Mapa de colores pastel
const colorPastelMap: Record<string, string> = {
  blanco: "#ffffff",
  rosado: "#ffe4ec",
  violeta: "#C8A2C8",
  negro: "#d9d9d9",
};

// 🔖 Formatear nombre de color en plural
const formatColorName = (color: string) => {
  if (!color) return "";
  const base = color.charAt(0).toUpperCase() + color.slice(1);
  if (base === "Rosado") return "Rosadas";
  if (base === "Violeta") return "Violetas";
  if (base === "Negro") return "Negras";
  if (base === "Blanco") return "Blancas";
  return base;
};

export default function Packs() {
  // 💾 Estados
  const [items, setItems] = useState<DataType[]>([]);
  const [tipo, setTipo] = useState<"Niño" | "Niña">("Niño");
  const [color, setColor] = useState<string>("rosado");
  const [talle, setTalle] = useState<string>("6");
  const [packs, setPacks] = useState<number>(1);
  const [allTalles, setAllTalles] = useState<boolean>(false);

  // 📊 Resultados
  const [resultados, setResultados] = useState<
    {
      talle: string;
      color: string;
      stockBlanco: number;
      stockColor: number;
      necesBlanco: number;
      necesColor: number;
      faltanBlanco: number;
      faltanColor: number;
    }[]
  >([]);

  // 📏 Talles
  const talles = ["6", "8", "10", "12", "14", "16"];

  // 🎨 Colores válidos
  const opcionesColores: Record<"Niño" | "Niña", string[]> = {
    Niña: ["rosado", "violeta"],
    Niño: ["negro"],
  };

  // 🔹 Escucha Firestore
  useEffect(() => {
    const unsub = onSnapshot(coll, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        key: d.id,
        talle: d.data().talle ?? "",
        color:
          (d.data().color ?? "").toLowerCase() === "lila"
            ? "violeta" // 🔹 normalizamos lila a violeta
            : d.data().color ?? "",
        cantidad: Number(d.data().cantidad ?? 0),
        tipo: d.data().tipo ?? "Niño",
      })) as DataType[];
      setItems(data);
    });
    return () => unsub();
  }, []);

  // 🧮 Calcular packs
  const calcularPacks = () => {
    const tallesCalcular = allTalles ? talles : [talle];

    const nuevosResultados = tallesCalcular.map((t) => {
      // Stock blanco de tipo Kids
      const stockBlanco =
        items.find(
          (i) =>
            i.color.toLowerCase() === "blanco" &&
            i.talle === t &&
            i.tipo.toLowerCase() === "kids"
        )?.cantidad ?? 0;

      // Stock del color seleccionado
      const stockColor =
        items.find(
          (i) =>
            i.color.toLowerCase() === color.toLowerCase() &&
            i.talle === t &&
            i.tipo === tipo
        )?.cantidad ?? 0;

      const necesBlanco = packs * 2;
      const necesColor = packs * 2;

      return {
        talle: t,
        color, // 🔹 guardamos color usado
        stockBlanco,
        stockColor,
        necesBlanco,
        necesColor,
        faltanBlanco: Math.max(0, necesBlanco - stockBlanco),
        faltanColor: Math.max(0, necesColor - stockColor),
      };
    });

    setResultados(nuevosResultados);
    message.success("Cálculo realizado");
  };

  // 🔖 Color de etiqueta según faltantes
  const getColorTag = (faltan: number) => {
    if (faltan === 0) return "green";
    if (faltan <= 4) return "orange";
    return "red";
  };

  // 🎨 Render cuadro visual
  const renderColorBox = (color: string, label: string) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          backgroundColor: colorPastelMap[color.toLowerCase()] || "#f5f5f5",
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SkinOutlined style={{ fontSize: 20, color: "#444" }} />
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "50px auto", padding: "0 16px" }}>
      {/* 🔹 Encabezado */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title
          level={2}
          style={{
            textAlign: "center",
            color: "#3f3f3f",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ShoppingOutlined style={{ fontSize: 36, color: "#1677ff" }} />
          Cálculo de Packs de Remeras
        </Title>
      </div>

      {/* 🔸 Controles */}
      <Card
        style={{
          marginBottom: 32,
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <Space wrap style={{ width: "100%", justifyContent: "center" }}>
          <Select
            value={tipo}
            onChange={(v) => {
              setTipo(v);
              setColor(opcionesColores[v][0]);
            }}
            style={{ width: 150 }}
            options={[
              { value: "Niño", label: "Niño" },
              { value: "Niña", label: "Niña" },
            ]}
          />

          <Select
            value={color}
            onChange={setColor}
            style={{ width: 180 }}
            options={opcionesColores[tipo].map((c) => ({
              value: c,
              label: `${c} - blanco`,
            }))}
          />

          {!allTalles && (
            <Select
              value={talle}
              onChange={setTalle}
              style={{ width: 140 }}
              options={talles.map((t) => ({
                value: t,
                label: `Talle ${t}`,
              }))}
            />
          )}

          <InputNumber
            min={1}
            value={packs}
            onChange={(v) => setPacks(v || 1)}
            style={{ width: 140 }}
            addonAfter="packs"
          />

          <Checkbox checked={allTalles} onChange={(e) => setAllTalles(e.target.checked)}>
            Todas las talles
          </Checkbox>

          <Button type="primary" size="large" onClick={calcularPacks}>
            Calcular
          </Button>
        </Space>
      </Card>

      {/* 🧾 Resultados */}
      {resultados.map((res) => (
        <Card
          key={res.talle}
          style={{
            marginBottom: 20,
            backgroundColor:
              res.faltanBlanco === 0 && res.faltanColor === 0
                ? "#e6fffb"
                : res.faltanBlanco <= 4 && res.faltanColor <= 4
                ? "#fffbe6"
                : "#fff1f0",
            borderRadius: 12,
            padding: 24,
          }}
          title={
            <Title level={4} style={{ margin: 0, color: "#444" }}>
              {tipo} · Talle {res.talle} · Pack {formatColorName(res.color)} + blanco
            </Title>
          }
        >
          <Row gutter={[24, 24]}>
            {/* Blanco */}
            <Col xs={24} md={12}>
              <Space align="center" size="middle">
                {renderColorBox("blanco", "Color Blanco")}
                <Text strong style={{ fontSize: 16 }}>Remeras Blancas (Kids)</Text>
              </Space>
              <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                <Text>Stock: {res.stockBlanco}</Text> <br />
                <Text>Necesitás: {res.necesBlanco}</Text> <br />
                <Tag color={getColorTag(res.faltanBlanco)} style={{ fontSize: 14 }}>
                  {res.faltanBlanco > 0 ? `Faltan ${res.faltanBlanco}` : "Stock OK"}
                </Tag>
              </div>
            </Col>

            {/* Color seleccionado */}
            <Col xs={24} md={12}>
              <Space align="center" size="middle">
                {renderColorBox(res.color, `Color ${formatColorName(res.color)}`)}
                <Text strong style={{ fontSize: 16 }}>
                  Remeras {formatColorName(res.color)}
                </Text>
              </Space>
              <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                <Text>Stock: {res.stockColor}</Text> <br />
                <Text>Necesitás: {res.necesColor}</Text> <br />
                <Tag color={getColorTag(res.faltanColor)} style={{ fontSize: 14 }}>
                  {res.faltanColor > 0 ? `Faltan ${res.faltanColor}` : "Stock OK"}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
}
