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

interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  tipo: "Niño" | "Niña" | "Mujer" | "Kids";
}

const coll = collection(db, "v");

export default function Packs() {
  // 🔹 Estados
  const [items, setItems] = useState<DataType[]>([]);
  const [tipo, setTipo] = useState<"" | "Niño" | "Niña">("");
  const [color, setColor] = useState<string>("");
  const [talle, setTalle] = useState<string>("");
  const [packs, setPacks] = useState<number | null>(null);
  const [usarTodasTalles, setUsarTodasTalles] = useState(false);

  // 📊 Resultado general (puede ser 1 o varios)
  const [resultados, setResultados] = useState<
    {
      talle: string;
      stockBlanco: number;
      stockColor: number;
      necesBlanco: number;
      necesColor: number;
      faltanBlanco: number;
      faltanColor: number;
    }[]
  >([]);

  const talles = ["6", "8", "10", "12", "14", "16"];

  const opcionesColores: Record<"Niño" | "Niña", string[]> = {
    Niña: ["rosado", "violeta"],
    Niño: ["negro"],
  };

  const colorPastelMap: Record<string, string> = {
    blanco: "#ffffff",
    rosado: "#ffe4ec",
    violeta: "#C8A2C8",
    negro: "#d9d9d9",
  };

  // 🔹 Firestore realtime
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

  // 🧮 Cálculo para uno o varios talles
  const calcularPacks = () => {
    if (!tipo || !color || !packs) {
      message.warning("Completá tipo, color y cantidad de packs.");
      return;
    }

    const tallesCalcular = usarTodasTalles ? talles : [talle];

    if (!usarTodasTalles && !talle) {
      message.warning("Seleccioná un talle o activá 'todas las talles'.");
      return;
    }

    const nuevosResultados = tallesCalcular.map((t) => {
      const stockBlanco =
        items.find(
          (i) =>
            i.color.toLowerCase() === "blanco" &&
            i.talle === t &&
            i.tipo.toLowerCase() === "kids"
        )?.cantidad ?? 0;

      const stockColor =
        items.find(
          (i) =>
            i.color.toLowerCase() === color.toLowerCase() &&
            i.talle === t &&
            i.tipo === tipo
        )?.cantidad ?? 0;

      const necesBlanco = packs * 2;
      const necesColor = packs * 2;
      const faltanBlanco = Math.max(0, necesBlanco - stockBlanco);
      const faltanColor = Math.max(0, necesColor - stockColor);

      return {
        talle: t,
        stockBlanco,
        stockColor,
        necesBlanco,
        necesColor,
        faltanBlanco,
        faltanColor,
      };
    });

    setResultados(nuevosResultados);
    message.success("Cálculo realizado ✅");

    // 🔄 Limpiar el formulario (excepto checkbox)
    setTipo("");
    setColor("");
    setTalle("");
    setPacks(null);
  };

  // 🔖 Colores para tags
  const getColorTag = (faltan: number) => {
    if (faltan === 0) return "green";
    if (faltan <= 4) return "orange";
    return "red";
  };

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

      {/* 🧩 FORMULARIO */}
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
            placeholder="Tipo"
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
            placeholder="Color"
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

          {/* Checkbox: usar todas las talles */}
          <Checkbox
            checked={usarTodasTalles}
            onChange={(e) => setUsarTodasTalles(e.target.checked)}
          >
            Usar todas las talles
          </Checkbox>

          {/* Talle */}
          <Select
            placeholder="Talle"
            value={talle || undefined}
            onChange={setTalle}
            style={{ width: 140 }}
            options={talles.map((t) => ({
              value: t,
              label: `Talle ${t}`,
            }))}
            disabled={usarTodasTalles}
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

          <Button type="primary" size="large" onClick={calcularPacks}>
            Calcular
          </Button>
        </Space>
      </Card>

      {/* 🧾 RESULTADOS */}
      {resultados.length > 0 && (
        <div>
          {resultados.map((res) => (
            <Card
              key={res.talle}
              style={{
                marginBottom: 24,
                backgroundColor:
                  res.faltanBlanco === 0 && res.faltanColor === 0
                    ? "#e6fffb"
                    : res.faltanBlanco <= 4 && res.faltanColor <= 4
                    ? "#fffbe6"
                    : "#fff1f0",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
              }}
              title={
                <Title level={4} style={{ margin: 0, color: "#444" }}>
                  {tipo} · Talle {res.talle} · Pack {color} + blanco
                </Title>
              }
            >
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Space align="center" size="middle">
                    {renderColorBox("blanco", "Color Blanco")}
                    <Text strong style={{ fontSize: 16 }}>
                      Remeras Blancas (Kids)
                    </Text>
                  </Space>
                  <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                    <Text>Stock: {res.stockBlanco}</Text> <br />
                    <Text>Necesitás: {res.necesBlanco}</Text> <br />
                    <Tag
                      color={getColorTag(res.faltanBlanco)}
                      style={{ fontSize: 14, padding: "4px 10px" }}
                    >
                      {res.faltanBlanco > 0
                        ? `Faltan ${res.faltanBlanco}`
                        : "Stock OK"}
                    </Tag>
                  </div>
                </Col>

                <Col span={12}>
                  <Space align="center" size="middle">
                    {renderColorBox(color, `Color ${color}`)}
                    <Text strong style={{ fontSize: 16 }}>
                      Remeras {color.charAt(0).toUpperCase() + color.slice(1)}
                    </Text>
                  </Space>
                  <div style={{ marginTop: 12, lineHeight: "1.8em" }}>
                    <Text>Stock: {res.stockColor}</Text> <br />
                    <Text>Necesitás: {res.necesColor}</Text> <br />
                    <Tag
                      color={getColorTag(res.faltanColor)}
                      style={{ fontSize: 14, padding: "4px 10px" }}
                    >
                      {res.faltanColor > 0
                        ? `Faltan ${res.faltanColor}`
                        : "Stock OK"}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
