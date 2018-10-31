// @flow
import { Mutation } from 'react-apollo';
import { adopt } from 'react-adopt';
import { Value } from 'react-powerplug';
import gql from 'graphql-tag';

const buildRemoveMutation = ({ removeName, typeName }) => gql`
  mutation Remove${typeName}($id: ID!) {
    ${removeName}(id: $id)
  }
`;

const buildOptions = ({ typeName }) => {
  const removeName = `remove${typeName}`;

  return {
    typeName,
    removeName,
  };
};

const handle = ({
  itemId,
  mutation,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
  bag,
  operationName,
}) => async () => {
  try {
    const { data } = await mutation();

    if (successNotification) {
      successNotification('Eliminado com sucesso.');
    }

    if (onSuccess) {
      onSuccess({ itemId, result: data && data[operationName], bag });
    }
  } catch (error) {
    if (errorNotification) {
      errorNotification('Erro ao tentar eliminar o item.');
    }

    if (onError) {
      onError({ itemId, error, bag });
    }
  }
};

export default ({
  typeName,
  refetchQueries,
  errorNotification,
  successNotification,
  onError,
  onSuccess,
}) => {
  const options = buildOptions({ typeName });

  const REMOVE_MUTATION = buildRemoveMutation(options);

  const Wrapper = adopt(
    {
      props: ({ itemId, bag, render }) => (
        <Value initial={{ itemId, bag }}>{({ value }) => render(value)}</Value>
      ),
      removeMutation: ({ itemId, render }) => (
        <Mutation
          mutation={REMOVE_MUTATION}
          variables={{ id: itemId }}
          refetchQueries={() => [...refetchQueries]}
        >
          {(mutation, data) => render({ mutation, data })}
        </Mutation>
      ),
    },
    ({ props: { itemId, bag }, removeMutation }) => {
      const {
        mutation,
        data: { loading: removing, error: removeMutationError },
      } = removeMutation;
      let error = null;

      if (removeMutationError) {
        error = { ...(error || {}), removeMutationError };
      }

      if (error && onError) {
        onError({ error });
      }

      const remove = handle({
        itemId,
        mutation,
        successNotification,
        errorNotification,
        onSuccess,
        onError,
        bag,
        operationName: options.removeName,
      });

      return { remove, removing, error };
    }
  );

  return Wrapper;
};
