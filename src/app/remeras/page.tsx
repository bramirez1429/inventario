"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  Button,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Select,
} from "antd";
import { db } from "../../../firebase/firebase.config";
import { TableS, EditableColumn } from "../container/TableS";
import Link from "next/link";

interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
}

type FieldType = {
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
};

const coll = collection(db, "v");

export default function Remeras() {
  const [items, setItems] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(coll, (snapshot) => {
      setItems(
        snapshot.docs.map((d) => ({
          key: d.id,
          talle: d.data().talle ?? "",
          color: d.data().color ?? "",
          cantidad: d.data().cantidad ?? 0,
          cuello: d.data().cuello ?? "Redondo",
          tipo: d.data().tipo ?? "Niño",
        }))
      );
    });
    return () => unsubscribe();
  }, []);

  // Agregar producto
  const handleAddItem = async (values: FieldType) => {
    setLoading(true);
    try {
      await addDoc(coll, {
        talle: values.talle,
        color: values.color,
        cantidad: values.cantidad,
        cuello: values.cuello,
        tipo: values.tipo,
      });
      message.success("Producto agregado");
    } finally {
      setLoading(false);
    }
  };

  // Editar
  const handleEdit = async (record: DataType) => {
    try {
      await updateDoc(doc(db, "v", record.key), {
        talle: record.talle,
        color: record.color,
        cantidad: record.cantidad,
        cuello: record.cuello,
        tipo: record.tipo,
      });
      message.success("Producto actualizado");
    } catch (e) {
      console.error("Error actualizando:", e);
    }
  };

  // Eliminar
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "v", id));
    message.success("Producto eliminado");
  };

  // 🎨 Colores disponibles (map para la muestra)
  const colorMap: Record<string, string> = {
    negro: "#000000",
    blanco: "#ffffff",
    gris: "#808080",
    "marron chocolate": "#7B3F00",
    rosado: "#FFC0CB",
    violeta: "#8A2BE2",
    rayado:
      "repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)",
    "crema rayado":
      "repeating-linear-gradient(45deg, #f5f5dc, #f5f5dc 10px, #fff 10px, #fff 20px)",
  };

  // Columnas de la tabla
  const columns: EditableColumn[] = [
    { title: "Talle", dataIndex: "talle", key: "talle", editable: true },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      editable: true,
      render: (value: string) => {
        const style =
          value === "rayado" || value === "crema rayado"
            ? { background: colorMap[value] }
            : { backgroundColor: colorMap[value] || "#ccc" };

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                border: "1px solid #ddd",
                borderRadius: 4,
                ...style,
              }}
            />
            <span>{value}</span>
          </div>
        );
      },
    },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", editable: true },
  ];

  const postColumns: EditableColumn[] = [
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Popconfirm
          title="¿Eliminar este producto?"
          onConfirm={() => handleDelete(record.key)}
        >
          <Button danger size="small">Eliminar</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "50px auto" }}>

       <Link href="/">
            <Button variant="outlined" size="large" style={{ marginBottom: 24 }}>
              Lista de Productos 
            </Button>
          </Link>
      {/* Formulario de alta de producto */}
      <Form<FieldType>
        layout="inline"
        onFinish={handleAddItem}
        autoComplete="off"
        style={{ marginBottom: 24, flexWrap: "wrap", gap: "12px" }}
      >
        {/* 👉 Talles Niños + Adultos */}
        <Form.Item<FieldType>
          name="talle"
          rules={[{ required: true, message: "Ingrese un talle" }]}
        >
          <Select placeholder="Talle" style={{ width: 160 }}>
            <Select.OptGroup label="Niños">
              <Select.Option value="6">6</Select.Option>
              <Select.Option value="8">8</Select.Option>
              <Select.Option value="10">10</Select.Option>
              <Select.Option value="12">12</Select.Option>
              <Select.Option value="14">14</Select.Option>
            </Select.OptGroup>

            <Select.OptGroup label="Adultos">
              <Select.Option value="S">S</Select.Option>
              <Select.Option value="M">M</Select.Option>
              <Select.Option value="L">L</Select.Option>
              <Select.Option value="XL">XL</Select.Option>
              <Select.Option value="2XL">2XL</Select.Option>
              <Select.Option value="3XL">3XL</Select.Option>
            </Select.OptGroup>
          </Select>
        </Form.Item>

        {/* Color */}
        <Form.Item<FieldType>
          name="color"
          rules={[{ required: true, message: "Ingrese un color" }]}
        >
          <Select placeholder="Color" style={{ width: 180 }}>
            {Object.keys(colorMap).map((c) => (
              <Select.Option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Cantidad */}
        <Form.Item<FieldType>
          name="cantidad"
          rules={[{ required: true, message: "Ingrese la cantidad" }]}
        >
          <InputNumber placeholder="Cantidad" min={1} />
        </Form.Item>

        {/* Cuello */}
        <Form.Item<FieldType>
          name="cuello"
          rules={[{ required: true, message: "Seleccione cuello" }]}
        >
          <Select placeholder="Cuello" style={{ width: 140 }}>
            <Select.Option value="V">V</Select.Option>
            <Select.Option value="Redondo">Redondo</Select.Option>
          </Select>
        </Form.Item>

        {/* Tipo */}
        <Form.Item<FieldType>
          name="tipo"
          rules={[{ required: true, message: "Seleccione tipo" }]}
        >
          <Select placeholder="Tipo" style={{ width: 140 }}>
            <Select.Option value="Niño">Niño</Select.Option>
            <Select.Option value="Niña">Niña</Select.Option>
            <Select.Option value="Mujer">Mujer</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Agregar
          </Button>
        </Form.Item>
      </Form>

      {/* Tabla editable */}
      <TableS
        initialData={items}
        restColumns={columns}
        postColumns={postColumns}
        onChange={(newData) => newData.forEach((row) => handleEdit(row))}
      />
    </div>
  );
}
