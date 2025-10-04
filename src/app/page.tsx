"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.config";
import {
  List,
  Typography,
  Divider,
  Button,
  Space,
  message,
  Tag,
  Layout,
  Row,
  Col,
  Select,
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { SelectProps } from "antd";

const { Footer, Content } = Layout;

/* 1️⃣ Tipado de Firestore */
interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
}

const coll = collection(db, "v");

/* 2️⃣ Orden lógico de talles */
const orderMap: Record<string, number> = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  "2XL": 5,
  "3XL": 6,
  "6": 7,
  "8": 8,
  "10": 9,
  "12": 10,
  "14": 11,
  "16": 12,
};

export default function HomePage() {
  /* 3️⃣ Estados */
  const [items, setItems] = useState<DataType[]>([]);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  /* 4️⃣ Escucha Firestore en tiempo real */
  useEffect(() => {
    const unsubscribe = onSnapshot(coll, (snapshot) => {
      setItems(
        snapshot.docs.map((d) => ({
          key: d.id,
          talle: d.data().talle ?? "",
          color: d.data().color ?? "",
          cantidad: Number(d.data().cantidad) ?? 0,
          cuello: d.data().cuello ?? "Redondo",
          tipo: d.data().tipo ?? "Niño",
        }))
      );
    });
    return () => unsubscribe();
  }, []);

  /* 5️⃣ Actualiza manualmente (+/-) */
  const updateCantidad = async (
    record: DataType,
    delta: number,
    action: "plus" | "minus"
  ) => {
    try {
      setLoadingBtn(`${record.key}-${action}`);
      const newCantidad = Math.max(0, record.cantidad + delta);
      await updateDoc(doc(db, "v", record.key), { cantidad: newCantidad });
      message.success(`Talle ${record.talle} actualizado a ${newCantidad}`);
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar stock");
    } finally {
      setLoadingBtn(null);
    }
  };

  /* 6️⃣ Colores de fondo según stock */
  const getBackground = (cantidad: number) => {
    if (cantidad <= 0) return "#ffecec";
    if (cantidad <= 5) return "#fffbe6";
    return "#b9fbc0";
  };

  /* 7️⃣ Mensajes visuales */
  const getTag = (cantidad: number) => {
    if (cantidad === 0)
      return <Tag color="red">¡Sin stock!</Tag>;
    if (cantidad <= 2)
      return <Tag color="orange">Poco stock</Tag>;
    return null;
  };

  /* 8️⃣ Agrupación */
  const groups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) =>
      set.add(`${i.tipo} - ${i.color} - ${i.cuello}`)
    );
    return Array.from(set).sort();
  }, [items]);

  const groupsToShow = selectedPacks.length > 0 ? selectedPacks : groups;

/* 9️⃣ Descuento automático con prioridad */
const handleDescontar = async () => {
  try {
    const tallesMap: Record<string, string[]> = {};

    // Agrupa por talle: { "6": ["rosado", "violeta"], "8": ["negro"], ... }
    for (const val of selectedOptions) {
      const [color, talle] = val.split("-");
      if (!tallesMap[talle]) tallesMap[talle] = [];
      tallesMap[talle].push(color);
    }

    // Iterar por talle
    for (const talle of Object.keys(tallesMap)) {
      const colores = tallesMap[talle];

      // 🟢 Buscar blanco actual
      const blancoItem = items.find(
        (i) => i.color.toLowerCase() === "blanco" && i.talle === talle
      );
      if (!blancoItem) {
        message.warning(`No hay remeras blancas registradas en talle ${talle}`);
        continue;
      }

      let stockBlanco = blancoItem.cantidad;

      // 🧮 Recorre los packs en el orden seleccionado
      for (const color of colores) {
        // Verificar stock blanco antes de descontar
        if (stockBlanco < 2) {
          message.warning(
            `No hay más stock blanco para continuar con los packs del talle ${talle}`
          );
          break; // detiene descuento en este talle
        }

        // Busca el color del pack
        const colorItem = items.find(
          (i) => i.color.toLowerCase() === color && i.talle === talle
        );
        if (!colorItem) continue;

        if (colorItem.cantidad < 2) {
          message.warning(
            `No hay suficiente stock de ${color} talle ${talle}, se omite este pack`
          );
          continue;
        }

        // Descuento: 2 del color y 2 blancas
        const nuevoStockColor = Math.max(0, colorItem.cantidad - 2);
        stockBlanco = Math.max(0, stockBlanco - 2);

        await updateDoc(doc(db, "v", colorItem.key), {
          cantidad: nuevoStockColor,
        });
        await updateDoc(doc(db, "v", blancoItem.key), {
          cantidad: stockBlanco,
        });

        // 🟡 Alertas si queda sin stock
        if (nuevoStockColor === 0)
          message.warning(`Ahora no queda más stock ${color} (talle ${talle})`);
        if (stockBlanco === 0)
          message.warning(`Ahora no queda más stock blanco (talle ${talle})`);

        message.success(`Descontado pack ${color} (talle ${talle})`);
      }
    }

    setSelectedOptions([]);
  } catch (err) {
    console.error(err);
    message.error("Error al descontar stock");
  }
};


  /* 🔟 TagRender SEGURO (sin undefined.split) */
  const tagRender: SelectProps["tagRender"] = (props) => {
    const { label, value, closable, onClose } = props;
    if (!value || typeof value !== "string") {
      return (
        <Tag color="#d9d9d9" closable={closable} onClose={onClose}>
          {label || "?"}
        </Tag>
      );
    }

    const [colorName] = value.split("-");
    const colorHex =
      colorName === "rosado"
        ? "#ffd6e7"
        : colorName === "violeta"
        ? "#d8b4fe"
        : colorName === "negro"
        ? "#d9d9d9"
        : "#eaeaea";

    return (
      <Tag
        color={colorHex}
        closable={closable}
        onClose={onClose}
        style={{ marginInlineEnd: 4, color: "#333", fontWeight: 500 }}
      >
        {label}
      </Tag>
    );
  };

  /* 1️⃣1️⃣ Opciones con disable si stock < 2 */
  const options: SelectProps["options"] = [
    {
      label: "Pack Rosado",
      title: "Pack Rosado",
      options: ["6", "8", "10", "12", "14"].map((t) => ({
        label: `Talle ${t}`,
        value: `rosado-${t}`,
        disabled:
          (items.find((i) => i.color.toLowerCase() === "rosado" && i.talle === t)?.cantidad ?? 0) < 2,
      })),
    },
    {
      label: "Pack Violeta",
      title: "Pack Violeta",
      options: ["6", "8", "10", "12", "14"].map((t) => ({
        label: `Talle ${t}`,
        value: `violeta-${t}`,
        disabled:
          (items.find((i) => i.color.toLowerCase() === "violeta" && i.talle === t)?.cantidad ?? 0) < 2,
      })),
    },
    {
      label: "Pack Negro",
      title: "Pack Negro",
      options: ["6", "8", "10", "12", "14"].map((t) => ({
        label: `Talle ${t}`,
        value: `negro-${t}`,
        disabled:
          (items.find((i) => i.color.toLowerCase() === "negro" && i.talle === t)?.cantidad ?? 0) < 2,
      })),
    },
  ];

  /* 1️⃣2️⃣ Render completo */
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ maxWidth: 1100, margin: "30px auto", width: "100%" }}>
        {/* 🔹 BOTONES ARRIBA */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/packs">
            <Button
              style={{
                backgroundColor: "#b9fbc0",
                borderColor: "#95e5a5",
                color: "#333",
              }}
              size="large"
              onClick={() => setSelectedPacks([])}
            >
              Armar Packs
            </Button>
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/remeras">
            <Button type="primary" size="large">
              Ver Lista de Remeras
            </Button>
          </Link>
        </div>

        <Typography.Title level={2} style={{ textAlign: "center" }}>
          Inventario por Categorías
        </Typography.Title>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {groups.map((group) => (
            <Button
              key={group}
              type={selectedPacks.includes(group) ? "primary" : "default"}
              disabled={!selectedPacks.includes(group) && selectedPacks.length >= 4}
              onClick={() =>
                setSelectedPacks((prev) =>
                  prev.includes(group)
                    ? prev.filter((g) => g !== group)
                    : [...prev, group]
                )
              }
              style={{ margin: "0 8px 8px 0" }}
            >
              {group}
            </Button>
          ))}
        </div>

        {/* 🔹 SELECT CON TAGS */}
        <Divider orientation="center" style={{ marginTop: 40 }}>
          Packs por Color y Talle
        </Divider>

        <Select
          mode="multiple"
          tagRender={tagRender}
          placeholder="Seleccioná talles y packs"
          style={{ width: "100%", marginBottom: 20 }}
          options={options}
          value={selectedOptions}
          onChange={(v) => setSelectedOptions(v as string[])}
        />

        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleDescontar}
            disabled={selectedOptions.length === 0}
          >
            Descontar Packs Seleccionados
          </Button>
        </div>

        {/* 🔹 LISTAS */}
        <Row gutter={[16, 16]}>
          {groupsToShow.map((group) => {
            const [tipo, color, cuello] = group.split(" - ");
            const groupItems = items
              .filter((i) => i.tipo === tipo && i.color === color && i.cuello === cuello)
              .sort(
                (a, b) => (orderMap[a.talle] ?? 999) - (orderMap[b.talle] ?? 999)
              );

            if (groupItems.length === 0) return null;

            return (
              <Col key={group} xs={24} md={12}>
                <Divider orientation="center">{group}</Divider>
                <List
                  bordered
                  dataSource={groupItems}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        backgroundColor: getBackground(item.cantidad),
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      actions={[
                        <Button
                          key="minus"
                          size="middle"
                          icon={<MinusOutlined />}
                          onClick={() => updateCantidad(item, -1, "minus")}
                          loading={loadingBtn === `${item.key}-minus`}
                          disabled={item.cantidad <= 0}
                        />,
                        <Button
                          key="plus"
                          type="primary"
                          size="middle"
                          icon={<PlusOutlined />}
                          onClick={() => updateCantidad(item, +1, "plus")}
                          loading={loadingBtn === `${item.key}-plus`}
                        />,
                      ]}
                    >
                      <Space>
                        <strong>Talle:</strong> {item.talle}
                        <span>
                          <strong>Cantidad:</strong> {item.cantidad}
                        </span>
                        {getTag(item.cantidad)}
                      </Space>
                    </List.Item>
                  )}
                />
              </Col>
            );
          })}
        </Row>
      </Content>

      <Footer style={{ textAlign: "center", backgroundColor: "#f0f2f5" }}>
        <Typography.Text type="secondary">
          © {new Date().getFullYear()} SAEL ® - Marca Registrada
        </Typography.Text>
      </Footer>
    </Layout>
  );
}
