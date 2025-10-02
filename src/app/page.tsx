"use client";

import { useEffect, useState } from "react";
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
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Footer, Content } = Layout;

interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
}

const colors = [
  "negro",
  "blanco",
  "gris",
  "marron chocolate",
  "rosado",
  "violeta",
  "rayado",
  "crema rayado",
];

const tipos: DataType["tipo"][] = ["Mujer", "Niña", "Niño"];
const cuellos: DataType["cuello"][] = ["V", "Redondo"];

const coll = collection(db, "v");

export default function HomePage() {
  const [items, setItems] = useState<DataType[]>([]);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

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

  const updateCantidad = async (
    record: DataType,
    delta: number,
    action: "plus" | "minus"
  ) => {
    try {
      setLoadingBtn(`${record.key}-${action}`);
      const newCantidad = Math.max(0, record.cantidad + delta);
      await updateDoc(doc(db, "v", record.key), { cantidad: newCantidad });

      if (newCantidad === 0) {
        message.warning(`El producto talle ${record.talle} quedó en 0. ¡Comprar urgente!`);
      } else if (newCantidad <= 2) {
        message.warning(`El producto talle ${record.talle} tiene muy poco stock`);
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

  // 🎨 fondo pastel según cantidad
  const getBackground = (cantidad: number) => {
    if (cantidad === 0 || cantidad < 3) return "#ffecec"; // rojo pastel
    if (cantidad >= 3 && cantidad <= 5) return "#fffbe6"; // amarillo pastel
    return "#dffce2ff"; // verde pastel
  };

  // 🔖 etiqueta según cantidad
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ maxWidth: 900, margin: "30px auto", width: "100%" }}>
        {/* 🔹 Botón de navegación */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/remeras">
            <Button type="primary" size="large" >
              Ver Lista de Remeras
            </Button>
          </Link>
        </div>

        <Typography.Title level={2} style={{ textAlign: "center" }}>
          Inventario por Categorías
        </Typography.Title>

        {tipos.map((tipo) =>
          colors.map((color) =>
            cuellos.map((cuello) => {
              const group = items.filter(
                (item) =>
                  (item.tipo ?? "").toLowerCase() === tipo.toLowerCase() &&
                  (item.color ?? "").toLowerCase() === color.toLowerCase() &&
                  (item.cuello ?? "").toLowerCase() === cuello.toLowerCase()
              );

              if (group.length === 0) return null;

              return (
                <div key={`${tipo}-${color}-${cuello}`} style={{ marginBottom: 24, padding:'0px 16px' }}>
                  <Divider orientation="left">
                    {tipo} - {color} - {cuello}
                  </Divider>
                  <List
                    bordered
                    dataSource={group}
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
                </div>
              );
            })
          )
        )}
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
