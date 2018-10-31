// @flow
import { message } from 'antd';
import itemUpdate from '../itemUpdate';
import itemCreate from '../itemCreate';
import itemRemove from '../itemRemove';

export default ({
  typeName,
  refetchQueries,
  fields,
  successNotification,
  errorNotification,
  onSuccess,
  onError,
  closeOnSuccess,
}) => {
  const successNotificationOption =
    successNotification === false ? null : successNotification || message.success;
  const errorNotificationOption =
    errorNotification === false ? null : errorNotification || message.error;
  const closeOnSuccessOption = closeOnSuccess === undefined || closeOnSuccess;
  const basicOptions = {
    typeName,
    refetchQueries,
    successNotification: successNotificationOption,
    errorNotification: errorNotificationOption,
    onError,
    onSuccess: res => {
      if (closeOnSuccessOption && res.bag && res.bag.modal) {
        res.bag.modal.close();
      }

      if (onSuccess) {
        onSuccess(res);
      }
    },
  };

  const UpdateItem = itemUpdate({
    ...basicOptions,
    fields,
  });

  const CreateItem = itemCreate({
    ...basicOptions,
    fields,
  });

  const RemoveItem = itemRemove({
    ...basicOptions,
  });

  return {
    UpdateItem,
    CreateItem,
    RemoveItem,
  };
};
