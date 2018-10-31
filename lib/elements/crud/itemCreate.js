import React from 'react';
import { join } from 'lodash';
import { Mutation } from 'react-apollo';
import { adopt } from 'react-adopt';
import { Value } from 'react-powerplug';
import gql from 'graphql-tag';

const buildCreateMutation = ({
  createName,
  fields,
  typeName,
  inputTypeName
}) => gql`
  mutation Create${typeName}($item: ${inputTypeName}!) {
    ${createName}(item: $item) {
      id ${join(fields, ' ')}
    }
  }
`;

const buildOptions = ({
  typeName,
  fields
}) => {
  const inputTypeName = `${typeName}Input`;
  const createName = `create${typeName}`;
  return {
    typeName,
    inputTypeName,
    createName,
    fields
  };
};

const handleSave = ({
  mutation,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
  bag,
  createName
}) => async item => {
  try {
    const {
      data
    } = await mutation({
      variables: {
        item
      }
    });

    if (successNotification) {
      successNotification('Adicionado com sucesso.');
    }

    if (onSuccess) {
      onSuccess({
        item,
        result: data && data[createName],
        bag
      });
    }
  } catch (error) {
    if (errorNotification) {
      errorNotification('Erro tentado adicionar novo item.');
    }

    if (onError) {
      onError({
        item,
        error,
        bag
      });
    }
  }
};

export default (({
  typeName,
  fields,
  refetchQueries,
  errorNotification,
  successNotification,
  onError,
  onSuccess
}) => {
  const options = buildOptions({
    typeName,
    fields
  });
  const CREATE_MUTATION = buildCreateMutation(options);
  const Wrapper = adopt({
    props: ({
      bag,
      render
    }) => React.createElement(Value, {
      initial: {
        bag
      }
    }, ({
      value
    }) => render(value)),
    createMutation: ({
      render
    }) => React.createElement(Mutation, {
      mutation: CREATE_MUTATION,
      refetchQueries: () => [...refetchQueries]
    }, (mutation, data) => render({
      mutation,
      data
    }))
  }, ({
    props: {
      bag
    },
    createMutation
  }) => {
    const {
      mutation,
      data: {
        loading: saving,
        error: createMutationError
      }
    } = createMutation;
    let error = null;

    if (createMutationError) {
      error = { ...(error || {}),
        createMutationError
      };
    }

    if (error && onError) {
      onError(error);
    }

    const save = handleSave({
      mutation,
      successNotification,
      errorNotification,
      onSuccess,
      onError,
      bag,
      createName: options.createName
    });
    return {
      save,
      saving,
      error
    };
  });
  return Wrapper;
});