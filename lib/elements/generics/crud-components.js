function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React, { Fragment } from 'react';
import { Button, Modal, Popconfirm, message } from 'antd';
import { adopt } from 'react-adopt';
export default (({
  RemoveItem,
  UpdateItem,
  CreateItem,
  ItemForm,
  EditModal
}) => {
  const confirmRemoveModal = remove => () => {
    Modal.confirm({
      title: 'Eliminar',
      content: 'Deseja realmente eliminar este item?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: remove
    });
  };

  const removeItem = confirm => async () => {
    const hide = message.loading('Eliminando...', 0);
    await confirm();
    hide();
  };

  const ConfirmRemove = ({
    confirm,
    children,
    item,
    ...rest
  }) => React.createElement(Popconfirm, _extends({
    title: "Deseja realmente eliminar este item?",
    onConfirm: removeItem(confirm),
    okText: "Sim",
    cancelText: "N\xE3o"
  }, rest), children);

  const RemoveButtonWrapper = adopt({
    remove: ({
      item,
      render
    }) => React.createElement(RemoveItem, {
      itemId: item.id
    }, render),
    confirm: ({
      item,
      remove,
      render
    }) => React.createElement(ConfirmRemove, {
      item: item,
      confirm: remove.remove
    }, render())
  });

  const RemoveButton = ({
    item,
    ...rest
  }) => React.createElement(RemoveButtonWrapper, {
    item: item
  }, () => React.createElement(Button, _extends({
    icon: "delete"
  }, rest)));

  const UpdateButtonWrapper = adopt({
    modal: ({
      itemId,
      render
    }) => React.createElement(EditModal, {
      itemId: itemId
    }, render),
    form: ({
      modal,
      itemId,
      render
    }) => modal.visible ? React.createElement(ItemForm, {
      itemId: itemId
    }, render) : render(),
    update: ({
      itemId,
      modal,
      render
    }) => {
      if (modal.visible) {
        return React.createElement(UpdateItem, {
          itemId: itemId,
          bag: {
            modal
          }
        }, render);
      }

      return render({});
    }
  }, ({
    modal,
    update,
    form
  }) => ({
    modal,
    update,
    form
  }));

  const UpdateButton = ({
    itemId,
    children,
    ...rest
  }) => React.createElement(UpdateButtonWrapper, {
    itemId: itemId
  }, ({
    modal,
    update,
    form
  }) => React.createElement(Fragment, null, React.createElement(Button, _extends({
    icon: "edit",
    disabled: modal.loading || update.oading,
    onClick: modal.open
  }, rest)), modal && modal.visible && children({
    modal,
    update,
    form
  })));

  const CreateButtonWrapper = adopt({
    modal: ({
      render
    }) => React.createElement(EditModal, {
      itemId: null
    }, render),
    form: ({
      modal,
      render
    }) => modal.visible ? React.createElement(ItemForm, {
      itemId: null
    }, render) : render(),
    create: ({
      modal,
      render
    }) => React.createElement(CreateItem, {
      bag: {
        modal
      }
    }, render)
  });

  const CreateButton = ({
    children,
    ...rest
  }) => React.createElement(CreateButtonWrapper, null, ({
    modal,
    create,
    form
  }) => React.createElement(Fragment, null, React.createElement(Button, _extends({
    icon: "plus",
    type: "primary",
    disabled: modal.loading,
    onClick: modal.open
  }, rest), "Adicionar"), modal && modal.visible && children({
    modal,
    create,
    form
  })));

  return {
    confirmRemoveModal,
    ConfirmRemove,
    RemoveButton,
    UpdateButton,
    CreateButton
  };
});