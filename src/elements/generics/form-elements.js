// @flow
import { message } from 'antd';
import itemForm from '../itemForm';

export default ({ typeName, queryFields, fields, errorNotification, onError }) => {
  const errorNotificationOption =
    errorNotification === false ? null : errorNotification || message.error;
  const options = {
    typeName,
    queryFields,
    fields,
    errorNotification: errorNotificationOption,
    onError,
  };

  const ItemForm = itemForm(options);

  return {
    ItemForm,
  };
};
