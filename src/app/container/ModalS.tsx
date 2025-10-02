import React, {FC, useState,cloneElement,ReactElement,isValidElement } from 'react';
import { Button, Modal } from 'antd';

type ClickableEl = ReactElement<{ onClick?: React.MouseEventHandler }>

interface ModalSProps {
    name?: string;
    button: ClickableEl;


}
export const ModalS: FC<ModalSProps> = ({name,button}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 3000);
  };

  const handleCancel = () => {
    setOpen(false);
  };
const injectedButton = isValidElement(button)
    ? cloneElement(button, {
        onClick: (e) => {
          button.props.onClick?.(e);
          showModal();
        },
      })
    : button;

  return (
    <>
     {injectedButton}
      <Modal
        open={open}
        title="Title"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Return
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
            Submit
          </Button>,
          <Button
            key="link"
            href="https://google.com"
            target="_blank"
            type="primary"
            loading={loading}
            onClick={handleOk}
          >
            Search on Google
          </Button>,
        ]}
      >
      
      </Modal>
    </>
  );
};
