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
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Footer, Content } = Layout;

// 📘 Tipado de cada documento en Firestore
interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
}

const coll = collection(db, "v");

// 📏 Orden de talles para que se vean en orden lógico
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
  // 🔹 Estados principales
  const [items, setItems] = useState<DataType[]>([]);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]); // grupos elegidos

  // 🔹 Escucha en tiempo real los productos de Firestore
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

  // 🔹 Actualizar cantidad (suma/resta)
  const updateCantidad = async (
    record: DataType,
    delta: number,
    action: "plus" | "minus"
  ) => {
    try {
      setLoadingBtn(`${record.key}-${action}`);
      const newCantidad = Math.max(0, record.cantidad + delta);
      await updateDoc(doc(db, "v", record.key), { cantidad: newCantidad });

      // 🔔 Alertas de stock
      if (newCantidad === 0) {
        message.warning(
          `El producto talle ${record.talle} quedó en 0. ¡Comprar urgente!`
        );
      } else if (newCantidad <= 2) {
        message.warning(
          `El producto talle ${record.talle} tiene muy poco stock`
        );
      } else {
        message.success("Cantidad actualizada");
      }
    } catch (err) {
      console.error("Error actualizando cantidad:", err);
      message.error("No se pudo actualizar");
    } finally {
      setLoadingBtn(null);
    }
  };

  // 🎨 Colores de fondo según stock
  const getBackground = (cantidad: number) => {
    if (cantidad === 0 || cantidad < 3) return "#ffecec"; // rojo pastel
    if (cantidad >= 3 && cantidad <= 5) return "#fffbe6"; // amarillo pastel
    return "#b9fbc0"; // verde pastel
  };

  // 🔖 Mensajes según stock
  const getTag = (cantidad: number) => {
    if (cantidad === 0) {
      return (
        <Tag color="red" style={{ fontWeight: "bold" }}>
          ¡Tenés que comprar urgente!
        </Tag>
      );
    }
    if (cantidad > 0 && cantidad <= 2) {
      return (
        <Tag color="orange" style={{ fontWeight: "bold" }}>
          ¡Tenés muy poco stock!
        </Tag>
      );
    }
    return null;
  };

  // 👉 Grupos dinámicos (ejemplo: "Niño - blanco - Redondo")
  const groups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) =>
      set.add(`${item.tipo} - ${item.color} - ${item.cuello}`)
    );
    return Array.from(set).sort();
  }, [items]);

  // 👉 Grupos a mostrar: si no hay packs seleccionados → se muestran todos
  const groupsToShow = selectedPacks.length > 0 ? selectedPacks : groups;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ maxWidth: 1100, margin: "30px auto", width: "100%" }}>
        {/* 🔹 Botón verde para iniciar selección de packs */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/packs">

          <Button
            style={{
              backgroundColor: "#b9fbc0",
              borderColor: "#95e5a5",
              color: "#333",
            }}
            size="large"
            onClick={() => setSelectedPacks([])} // reset selección
          >
            Armar Packs
          </Button>
          </Link>

        </div>

        {/* 🔹 Botón de navegación */}
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

        {/* 🔹 Botones de grupos para seleccionar hasta 4 */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {groups.map((group) => (
            <Button
              key={group}
              type={selectedPacks.includes(group) ? "primary" : "default"}
              disabled={
                !selectedPacks.includes(group) && selectedPacks.length >= 4
              }
              onClick={() => {
                setSelectedPacks((prev) =>
                  prev.includes(group)
                    ? prev.filter((g) => g !== group)
                    : [...prev, group]
                );
              }}
              style={{ margin: "0 8px 8px 0" }}
            >
              {group}
            </Button>
          ))}
        </div>

        {/* 🔹 Renderizado de tablas: en móvil (xs=24) → 1 por fila, en desktop (md=12) → 2 por fila */}
        <Row gutter={[16, 16]}>
          {groupsToShow.map((group) => {
            const [tipo, color, cuello] = group.split(" - ");
            const groupItems = items
              .filter(
                (i) => i.tipo === tipo && i.color === color && i.cuello === cuello
              )
              .sort(
                (a, b) =>
                  (orderMap[a.talle] ?? 999) - (orderMap[b.talle] ?? 999)
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
                          key="decrement"
                          size="middle"
                          style={{ minWidth: 40 }}
                          icon={<MinusOutlined />}
                          onClick={() => updateCantidad(item, -1, "minus")}
                          loading={loadingBtn === `${item.key}-minus`}
                          disabled={item.cantidad <= 0}
                        />,
                        <Button
                          key="increment"
                          type="primary"
                          size="middle"
                          style={{ minWidth: 40 }}
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

      {/* 🔹 Footer */}
      <Footer
        style={{
          textAlign: "center",
          backgroundColor: "#f0f2f5",
          padding: "10px 0",
        }}
      >
        <Typography.Text type="secondary">
          © {new Date().getFullYear()} SAEL ® - Marca Registrada
        </Typography.Text>
      </Footer>
    </Layout>
  );
}
