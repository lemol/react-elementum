import React, { useState, useEffect } from 'react';
import { join } from 'lodash';
import { useMutation } from 'react-apollo-hooks';
import gql from 'graphql-tag';

export type NotificationFn = (msg: string) => void;

export type CallbackOptions = {
  item?: any,
  error?: any,
}

export type CallbackFn = (options: CallbackOptions) => void;

export type Options = {
  typeName: string,
  fields: Array<string>,
  refetchQueries?: Array<string>,
  errorNotification?: NotificationFn,
  successNotification?: NotificationFn,
  onError?: CallbackFn,
  onSuccess?: CallbackFn,
}

const makeCreateMutation = ({ createMutationName, fields, typeName, inputTypeName }: any) => gql`
  mutation Create${typeName}($item: ${inputTypeName}!) {
    ${createMutationName}(item: $item) {
      id ${join(fields, ' ')}
    }
  }
`;

const makeOptions = ({ typeName, fields }: any) => {
  const inputTypeName = `${typeName}Input`;
  const createName = `create${typeName}`;

  return {
    typeName,
    inputTypeName,
    createName,
    fields,
  };
};

type MakeAfterSaveOptions = {
  errorNotification?: NotificationFn,
  successNotification?: NotificationFn,
  onError?: CallbackFn,
  onSuccess?: CallbackFn,
}

const handleAfterSave = ({
  errorNotification,
  successNotification,
  onError,
  onSuccess,
}: MakeAfterSaveOptions) => async (item?: any, error?: any) => {
  if (item) {
    if (successNotification) {
      successNotification('Adicionado com sucesso.');
    }

    if (onSuccess) {
      onSuccess({ item });
    }
  } else if (error) {
    if (errorNotification) {
      errorNotification('Erro tentado adicionar novo item.');
    }

    if (onError) {
      onError({ item, error });
    }
  }
};

export default ({
  typeName,
  fields,
  refetchQueries,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
}: Options) => {
  const options = makeOptions({ typeName, fields });
  const createMutation = makeCreateMutation(options);
  const afterSave = handleAfterSave({
    successNotification,
    errorNotification,
    onSuccess,
    onError,
  });

  return (initialValue: any) => {
    const [item, setItem] = useState(initialValue);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const mutation = useMutation(createMutation, {
      refetchQueries: () => refetchQueries ? refetchQueries : [],
    });

    useEffect(() => {
      afterSave(item, error);
    }, [item, error]);

    const save = async (value: any) => {
      setSaving(true);
      try {
        const result = await mutation({
          variables: {
            item: value,
          },
        });

        setError(null);
        setItem(result);
        return result;
      } catch(error) {
        setError(error);
        setItem(null);
      } finally {
        setSaving(false);
      }
    }

    return { save, saving, item, error };
  }
};
