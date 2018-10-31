import React, { Fragment } from 'react';
import { Button, Modal, Popconfirm, message } from 'antd';
import { adopt } from 'react-adopt';

export default ({ RemoveItem, UpdateItem, CreateItem, ItemForm, EditModal }) => {
  const confirmRemoveModal = remove => () => {
    Modal.confirm({
      title: 'Eliminar',
      content: 'Deseja realmente eliminar este item?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: remove,
    });
  };

  const removeItem = confirm => async () => {
    const hide = message.loading('Eliminando...', 0);
    await confirm();
    hide();
  };

  const ConfirmRemove = ({ confirm, children, ...rest }) => (
    <Popconfirm
      title="Deseja realmente eliminar este item?"
      onConfirm={removeItem(confirm)}
      okText="Sim"
      cancelText="Não"
      {...rest}
    >
      {children}
    </Popconfirm>
  );

  const RemoveButtonWrapper = adopt({
    remove: ({ item, render }) => <RemoveItem itemId={item.id}>{render}</RemoveItem>,
    confirm: ({ item, remove, render }) => (
      <ConfirmRemove item={item} confirm={remove.remove}>
        {render()}
      </ConfirmRemove>
    ),
  });

  const RemoveButton = ({ item, ...rest }) => (
    <RemoveButtonWrapper item={item}>
      {() => <Button icon="delete" {...rest} />}
    </RemoveButtonWrapper>
  );

  const UpdateButtonWrapper = adopt(
    {
      modal: ({ itemId, render }) => <EditModal itemId={itemId}>{render}</EditModal>,
      form: ({ modal, itemId, render }) =>
        modal.visible ? <ItemForm itemId={itemId}>{render}</ItemForm> : render(),
      update: ({ itemId, modal, render }) => {
        if (modal.visible) {
          return (
            <UpdateItem itemId={itemId} bag={{ modal }}>
              {render}
            </UpdateItem>
          );
        }

        return render({});
      },
    },
    ({ modal, update, form }) => ({
      modal,
      update,
      form,
    })
  );

  const UpdateButton = ({ itemId, children, ...rest }) => (
    <UpdateButtonWrapper itemId={itemId}>
      {({ modal, update, form }) => (
        <Fragment>
          <Button
            icon="edit"
            disabled={modal.loading || update.oading}
            onClick={modal.open}
            {...rest}
          />
          {modal && modal.visible && children({ modal, update, form })}
        </Fragment>
      )}
    </UpdateButtonWrapper>
  );

  const CreateButtonWrapper = adopt({
    modal: ({ render }) => <EditModal itemId={null}>{render}</EditModal>,
    form: ({ modal, render }) =>
      modal.visible ? <ItemForm itemId={null}>{render}</ItemForm> : render(),
    create: ({ modal, render }) => <CreateItem bag={{ modal }}>{render}</CreateItem>,
  });

  const CreateButton = ({ children, ...rest }) => (
    <CreateButtonWrapper>
      {({ modal, create, form }) => (
        <Fragment>
          <Button
            icon="plus"
            type="primary"
            disabled={modal.loading}
            onClick={modal.open}
            {...rest}
          >
            Adicionar
          </Button>
          {modal && modal.visible && children({ modal, create, form })}
        </Fragment>
      )}
    </CreateButtonWrapper>
  );

  return {
    confirmRemoveModal,
    ConfirmRemove,
    RemoveButton,
    UpdateButton,
    CreateButton,
  };
};
