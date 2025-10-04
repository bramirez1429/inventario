"use client";

import { useState, useEffect, useMemo } from "react";
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
  Divider,
  Typography,
  Space,
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

// 🔹 Tipo extendido (permite "Kids" solo en el front)
type FormTipo = DataType["tipo"] | "Kids";
type FieldType = Omit<DataType, "tipo"> & { tipo: FormTipo };

const coll = collection(db, "v");

// orden de talles
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

// colores disponibles
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

const cuellos: DataType["cuello"][] = ["V", "Redondo"];
const colors = Object.keys(colorMap);

export default function Remeras() {
  const [items, setItems] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [form] = Form.useForm<FieldType>();

  // 🔹 opciones dinámicas para "tipo"
  const [tipoOptions, setTipoOptions] = useState<FormTipo[]>([
    "Mujer",
    "Niño",
    "Niña",
  ]);

  useEffect(() => {
    const unsubscribe = onSnapshot(coll, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        key: d.id,
        talle: d.data().talle ?? "",
        color: d.data().color ?? "",
        cantidad: d.data().cantidad ?? 0,
        cuello: d.data().cuello ?? "Redondo",
        tipo: d.data().tipo ?? "Niño",
      }));
      data.sort(
        (a, b) => (orderMap[a.talle] ?? 999) - (orderMap[b.talle] ?? 999)
      );
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  // agregar
  const handleAddItem = async (values: FieldType) => {
    setLoading(true);
    try {
      // 🔹 si es Kids lo guardamos como Niño
      const tipoReal: DataType["tipo"] =
        values.tipo === "Kids" ? "Niño" : values.tipo;

      await addDoc(coll, { ...values, tipo: tipoReal });
      message.success("Producto agregado");
    } finally {
      setLoading(false);
    }
  };

  // editar
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
      message.error("No se pudo actualizar el producto");
    }
  };

  // eliminar
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "v", id));
    message.success("Producto eliminado");
  };

  // columnas de la tabla
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

  // grupos únicos dinámicos
  const groups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) =>
      set.add(
        `${item.tipo === "Niño" && item.color === "blanco" ? "Kids" : item.tipo
        } - ${item.color} - ${item.cuello}`
      )
    );
    return Array.from(set).sort();
  }, [items]);

  // 🔹 evento cuando cambia el color
  const handleColorChange = (color: string) => {
    form.setFieldValue("tipo", undefined); // resetea tipo
    if (color.toLowerCase() === "blanco") {
      setTipoOptions(["Mujer", "Kids"]); // solo Mujer y Kids
    } else {
      setTipoOptions(["Mujer", "Niño", "Niña"]); // todas las demás
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "50px auto", padding: "0 16px" }}>
      <Link href="/">
        <Button variant="outlined" size="large" style={{ marginBottom: 24 }}>
          Lista de Productos
        </Button>
      </Link>

      {/* Formulario de alta */}
      <Form<FieldType>
        form={form}
        layout="inline"
        onFinish={handleAddItem}
        autoComplete="off"
        style={{ marginBottom: 24, flexWrap: "wrap", gap: "12px" }}
      >
        {/* talle */}
        <Form.Item<FieldType>
          name="talle"
          rules={[{ required: true, message: "Ingrese un talle" }]}
        >
          <Select placeholder="Talle" style={{ width: 160 }}>
            <Select.OptGroup label="Niños">
              {["6", "8", "10", "12", "14", "16"].map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="Adultos">
              {["S", "M", "L", "XL", "2XL", "3XL"].map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
        </Form.Item>

        {/* color */}
        <Form.Item<FieldType>
          name="color"
          rules={[{ required: true, message: "Ingrese un color" }]}
        >
          <Select
            placeholder="Color"
            style={{ width: 180 }}
            onChange={handleColorChange} // 🔹 aquí el cambio dinámico
          >
            {colors.map((c) => (
              <Select.Option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* cantidad */}
        <Form.Item<FieldType>
          name="cantidad"
          rules={[{ required: true, message: "Ingrese la cantidad" }]}
        >
          <InputNumber placeholder="Cantidad" min={1} />
        </Form.Item>

        {/* cuello */}
        <Form.Item<FieldType>
          name="cuello"
          rules={[{ required: true, message: "Seleccione cuello" }]}
        >
          <Select placeholder="Cuello" style={{ width: 140 }}>
            {cuellos.map((c) => (
              <Select.Option key={c} value={c}>
                {c}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* tipo dinámico */}
        <Form.Item<FieldType>
          name="tipo"
          rules={[{ required: true, message: "Seleccione tipo" }]}
        >
          <Select placeholder="Tipo" style={{ width: 140 }}>
            {tipoOptions.map((t) => (
              <Select.Option key={t} value={t}>
                {t}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Agregar
          </Button>
        </Form.Item>
      </Form>

      {/* 🔹 Botones dinámicos */}
      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          {groups.map((group) => (
            <Button
              key={group}
              type={selectedGroup === group ? "primary" : "default"}
              onClick={() => setSelectedGroup(group)}
            >
              {group}
            </Button>
          ))}
          {selectedGroup && (
            <Button onClick={() => setSelectedGroup(null)}>Mostrar Todo</Button>
          )}
        </Space>
      </div>

      {/* 🔹 Tablas filtradas */}
      {(selectedGroup ? [selectedGroup] : groups).map((group) => {
        const [tipo, color, cuello] = group.split(" - ");
        const groupItems = items.filter(
          (i) =>
            (i.tipo === tipo || (i.tipo === "Niño" && tipo === "Kids")) &&
            i.color === color &&
            i.cuello === cuello
        );

        if (groupItems.length === 0) return null;

        return (
          <div key={group} style={{ marginBottom: 24 }}>
            <Divider orientation="left" style={{ color: "#888" }}>
              <Typography.Text strong>{group}</Typography.Text>
            </Divider>
            <TableS
              initialData={groupItems}
              restColumns={columns}
              postColumns={postColumns}
              onChange={(newData) => newData.forEach((row) => handleEdit(row))}
            />
          </div>
        );
      })}
    </div>
  );
}
