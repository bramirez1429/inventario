import React, { useState } from "react";
import type { TableProps } from "antd";
import { Form, Input, InputNumber, Popconfirm, Table, Typography, Select } from "antd";

export interface DataType {
  key: string;
  talle: string;
  color: string;
  cantidad: number;
  cuello: "Redondo" | "V";
  tipo: "Niño" | "Niña" | "Mujer";
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: keyof DataType;
  title: string;
  inputType: "number" | "text" | "selectCuello" | "selectTipo";
  record: DataType;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  ...restProps
}) => {
  let inputNode: React.ReactNode;

  switch (inputType) {
    case "number":
      inputNode = <InputNumber />;
      break;
    case "selectCuello":
      inputNode = (
        <Select>
          <Select.Option value="Redondo">Redondo</Select.Option>
          <Select.Option value="V">V</Select.Option>
        </Select>
      );
      break;
    case "selectTipo":
      inputNode = (
        <Select>
          <Select.Option value="Niño">Niño</Select.Option>
          <Select.Option value="Niña">Niña</Select.Option>
          <Select.Option value="Mujer">Mujer</Select.Option>
        </Select>
      );
      break;
    default:
      inputNode = <Input />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Ingrese ${title}` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export type EditableColumn = NonNullable<
  TableProps<DataType>["columns"]
>[number] & {
  editable?: boolean;
  dataIndex?: keyof DataType;
};

interface TableSProps {
  restColumns: EditableColumn[];
  initialData: DataType[];
  postColumns?: EditableColumn[];
  onChange?: (newData: DataType[]) => void;
}

export const TableS: React.FC<TableSProps> = ({
  restColumns,
  postColumns,
  initialData,
  onChange,
}) => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState<string>("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const edit = (record: DataType) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey("");

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as Partial<DataType>;
      const newData = [...initialData];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        newData.splice(index, 1, { ...newData[index], ...row });
        onChange?.(newData);
        setEditingKey("");
      }
    } catch (err) {
      console.log("Validate Failed:", err);
    }
  };

  const mergedColumns: TableProps<DataType>["columns"] = [
    ...restColumns,

    {
      title: "Cuello",
      dataIndex: "cuello",
      key: "cuello",
      editable: true,
      render: (value: DataType["cuello"], record: DataType, index: number) => (
        <span>{value}</span>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      editable: true,
      render: (value: DataType["tipo"], record: DataType, index: number) => (
        <span>{value}</span>
      ),
    },
    {
      title: "Acciones",
      key: "operation",
      render: (_: unknown, record: DataType, index: number) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key)}
              style={{ marginInlineEnd: 8 }}
            >
              Guardar
            </Typography.Link>
            <Popconfirm title="Seguro de cancelar?" onConfirm={cancel}>
              <a>Cancelar</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link
            disabled={editingKey !== ""}
            onClick={() => edit(record)}
          >
            Editar
          </Typography.Link>
        );
      },
    },

    ...(postColumns || []),
  ].map((col) => {
    if (!("editable" in col) || !col.editable || !col.dataIndex) return col;
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        inputType:
          col.dataIndex === "cantidad"
            ? "number"
            : col.dataIndex === "cuello"
            ? "selectCuello"
            : col.dataIndex === "tipo"
            ? "selectTipo"
            : "text",
        dataIndex: col.dataIndex,
        title: String(col.title),
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <Table<DataType>
        components={{ body: { cell: EditableCell } }}
        bordered
        rowKey="key"
        dataSource={initialData}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{ onChange: cancel }}
      />
    </Form>
  );
};
