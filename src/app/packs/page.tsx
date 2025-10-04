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
} from "antd";
import { ShoppingOutlined, SkinOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// 📘 Tipado exacto de los documentos
interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  tipo: "Niño" | "Niña" | "Mujer" | "Kids";
}

const coll = collection(db, "v");

export default function Packs() {
  // 💾 Estados principales
  const [items, setItems] = useState<DataType[]>([]);

  // 🧩 Estados del formulario (inicialmente vacíos)
  const [tipo, setTipo] = useState<"" | "Niño" | "Niña">("");
  const [color, setColor] = useState<string>("");
  const [talle, setTalle] = useState<string>("");
  const [packs, setPacks] = useState<number | null>(null);

  // 📊 Resultado de cálculo
  const [resultado, setResultado] = useState<{
    stockBlanco: number;
    stockColor: number;
    necesBlanco: number;
    necesColor: number;
    faltanBlanco: number;
    faltanColor: number;
  } | null>(null);

  // 📏 Talles disponibles
  const talles = ["6", "8", "10", "12", "14", "16"];

  // 🎨 Colores válidos (lila → violeta)
  const opcionesColores: Record<"Niño" | "Niña", string[]> = {
    Niña: ["rosado", "violeta"],
    Niño: ["negro"],
  };

  // 🎨 Mapa de colores pastel
  const colorPastelMap: Record<string, string> = {
    blanco: "#ffffff",
    rosado: "#ffe4ec",
    violeta: "#C8A2C8",
    negro: "#d9d9d9",
  };

  // 🔹 Escucha Firestore en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(coll, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        key: d.id,
        talle: d.data().talle ?? "",
        color:
          (d.data().color ?? "").toLowerCase() === "lila"
            ? "violeta"
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
    // Evitar cálculos con campos vacíos
    if (!tipo || !color || !talle || !packs) {
      message.warning("Por favor completa todos los campos antes de calcular.");
      return;
    }

    // ✅ Solo blancos tipo Kids
    const stockBlanco =
      items.find(
        (i) =>
          i.color.toLowerCase() === "blanco" &&
          i.talle === talle &&
          i.tipo.toLowerCase() === "kids"
      )?.cantidad ?? 0;

    // ✅ Color correspondiente (violeta si era lila)
    const stockColor =
      items.find(
        (i) =>
          i.color.toLowerCase() === color.toLowerCase() &&
          i.talle === talle &&
          i.tipo === tipo
      )?.cantidad ?? 0;

    const necesBlanco = packs * 2;
    const necesColor = packs * 2;

    const faltanBlanco = Math.max(0, necesBlanco - stockBlanco);
    const faltanColor = Math.max(0, necesColor - stockColor);

    setResultado({
      stockBlanco,
      stockColor,
      necesBlanco,
      necesColor,
      faltanBlanco,
      faltanColor,
    });

    message.success("Cálculo realizado correctamente ✅");

    // 🔄 Reiniciar formulario después de calcular
/*     setTipo("");
    setColor("");
    setTalle("");
    setPacks(null); */
  };

  // 🎨 Etiqueta de color de stock
  const getColorTag = (faltan: number) => {
    if (faltan === 0) return "green";
    if (faltan <= 4) return "orange";
    return "red";
  };

  // 🎨 Cuadro visual con color
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
      {/* 🔹 Título principal */}
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

      {/* 🔸 Formulario */}
      <Card
        style={{
          marginBottom: 32,
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <Space wrap style={{ width: "100%", justifyContent: "center" }}>
          {/* Tipo */}
          <Select
            placeholder="Seleccionar tipo"
            value={tipo || undefined}
            onChange={(v) => {
              setTipo(v);
              setColor("");
            }}
            style={{ width: 150 }}
            options={[
              { value: "Niño", label: "Niño" },
              { value: "Niña", label: "Niña" },
            ]}
          />

          {/* Color */}
          <Select
            placeholder="Seleccionar color"
            value={color || undefined}
            onChange={setColor}
            style={{ width: 180 }}
            options={
              tipo
                ? opcionesColores[tipo].map((c) => ({
                    value: c,
                    label: `${c} - blanco`,
                  }))
                : []
            }
            disabled={!tipo}
          />

          {/* Talle */}
          <Select
            placeholder="Seleccionar talle"
            value={talle || undefined}
            onChange={setTalle}
            style={{ width: 140 }}
            options={talles.map((t) => ({
              value: t,
              label: `Talle ${t}`,
            }))}
          />

          {/* Packs */}
          <InputNumber
            min={1}
            placeholder="Cantidad"
            value={packs ?? undefined}
            onChange={(v) => setPacks(v || 1)}
            style={{ width: 140 }}
            addonAfter="packs"
          />

          {/* Botón de cálculo */}
          <Button type="primary" size="large" onClick={calcularPacks}>
            Calcular
          </Button>
        </Space>
      </Card>

      {/* 🧾 Resultado */}
      {resultado && (
        <Card
          style={{
            backgroundColor:
              resultado.faltanBlanco === 0 && resultado.faltanColor === 0
                ? "#e6fffb"
                : resultado.faltanBlanco <= 4 && resultado.faltanColor <= 4
                ? "#fffbe6"
                : "#fff1f0",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
          }}
          title={
            <Title level={4} style={{ margin: 0, color: "#444" }}>
              {tipo} · Talle {talle} · Pack {color} + blanco
            </Title>
          }
        >
          <Row gutter={[24, 24]}>
            {/* Blanco (Kids) */}
            <Col span={12}>
              <Space align="center" size="middle">
                {renderColorBox("blanco", "Color Blanco")}
                <Text strong style={{ fontSize: 16 }}>
                  Remeras Blancas (Kids)
                </Text>
              </Space>
              <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                <Text>Stock: {resultado.stockBlanco}</Text> <br />
                <Text>Necesitás: {resultado.necesBlanco}</Text> <br />
                <Tag
                  color={getColorTag(resultado.faltanBlanco)}
                  style={{ fontSize: 14, padding: "4px 10px" }}
                >
                  {resultado.faltanBlanco > 0
                    ? `Faltan ${resultado.faltanBlanco}`
                    : "Stock OK"}
                </Tag>
              </div>
            </Col>

            {/* Color elegido */}
            <Col span={12}>
              <Space align="center" size="middle">
                {renderColorBox(color, `Color ${color}`)}
                <Text strong style={{ fontSize: 16 }}>
                  Remeras {color.charAt(0).toUpperCase() + color.slice(1)}
                </Text>
              </Space>
              <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                <Text>Stock: {resultado.stockColor}</Text> <br />
                <Text>Necesitás: {resultado.necesColor}</Text> <br />
                <Tag
                  color={getColorTag(resultado.faltanColor)}
                  style={{ fontSize: 14, padding: "4px 10px" }}
                >
                  {resultado.faltanColor > 0
                    ? `Faltan ${resultado.faltanColor}`
                    : "Stock OK"}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
