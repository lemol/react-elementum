// @flow
import { Mutation } from 'react-apollo';
import { lowerFirst } from 'lodash';
import { adopt } from 'react-adopt';
import { Value } from 'react-powerplug';
import gql from 'graphql-tag';
import { getItemQuery } from '../helpers';

const getUpdateMutation = ({ updateName, typeName, inputTypeName }) => gql`
  mutation Update${typeName}($id: ID!, $item: ${inputTypeName}!) {
    ${updateName}(id: $id, item: $item)
  }
`;

const buildOptions = ({ typeName, fields }) => {
  const name = lowerFirst(typeName);
  const inputTypeName = `${typeName}Input`;
  const updateName = `update${typeName}`;
  const queryName = `Get${typeName}`;
  const path = [name];

  return {
    typeName,
    inputTypeName,
    updateName,
    queryName,
    fields,
    path,
  };
};

const handleSave = ({
  itemId: id,
  mutation,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
  bag,
  operationName,
}) => async item => {
  delete item.id; // eslint-disable-line
  delete item.__typename; // eslint-disable-line

  try {
    const { data } = await mutation({
      variables: {
        id,
        item,
      },
    });

    if (successNotification) {
      successNotification('Actualizado com sucesso.');
    }

    if (onSuccess) {
      onSuccess({ item, result: data && data[operationName], bag });
    }

    return data[operationName];
  } catch (error) {
    if (errorNotification) {
      errorNotification('Erro ao tentar actualizar o item.');
    }

    if (onError) {
      onError({ item, error, bag });
    }
  }

  return null;
};

export default ({
  typeName,
  fields,
  refetchQueries,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
}) => {
  const options = buildOptions({ typeName, fields });

  const UPDATE_MUTATION = getUpdateMutation(options);
  const ITEM_QUERY = getItemQuery(options);

  const Wrapper = adopt(
    {
      props: ({ itemId, bag, render }) => (
        <Value initial={{ itemId, bag }}>{({ value }) => render(value)}</Value>
      ),
      updateMutation: ({ itemId, render }) => (
        <Mutation
          mutation={UPDATE_MUTATION}
          refetchQueries={() => [
            { query: ITEM_QUERY, variables: { id: itemId } },
            ...refetchQueries,
          ]}
        >
          {(mutation, data) => render({ mutation, data })}
        </Mutation>
      ),
    },
    ({ props: { itemId, bag }, updateMutation }) => {
      const {
        mutation,
        data: { loading: saving, error: updateMutationError },
      } = updateMutation;
      let error = null;

      if (updateMutationError) {
        error = { ...(error || {}), updateMutationError };
      }

      if (error && onError) {
        onError({ error });
      }

      const save = handleSave({
        itemId,
        mutation,
        successNotification,
        errorNotification,
        onSuccess,
        onError,
        bag,
        operationName: options.updateName,
      });

      return { save, saving, error };
    }
  );

  return Wrapper;
};
