import React from 'react';
import { drop, join, camelCase, get, set, dropRight } from 'lodash';
import { Query, Mutation } from 'react-apollo';
import { adopt } from 'react-adopt';
import gql from 'graphql-tag';
import { Value } from 'react-powerplug';
import { buildQuery } from '../helpers';
const MODAL_PROP_NAME = 'editModal';
const dataFields = ['itemId', 'visible'];

const getModalDataQuery = ({
  path,
  queryName
}) => gql`
  query ${queryName} {
    ${path[0]} @client {
      ${buildQuery({
  path: drop(path, 1),
  fields: dataFields
})}
    }
  }
`;

const getOpenModalMutation = ({
  name,
  openModal
}) => gql`
  mutation Open${name}($itemId: ID!) {
    ${openModal}(itemId: $itemId) @client
  }
`;

const getCloseModalMutation = ({
  name,
  closeModal
}) => gql`
  mutation Close${name} {
    ${closeModal} @client
  }
`;

const buildOptions = ({
  name
}) => {
  const nameArray = `${name}Modal`.split('$');
  const fullName = join(nameArray, '');
  const queryPath = ['page', ...nameArray.map(camelCase)];
  const openModal = `open${fullName}`;
  const closeModal = `close${fullName}`;
  const queryName = `Get${fullName}`;
  const parentName = join(dropRight(name.split('$'), 1), '');
  return {
    nameArray,
    name: fullName,
    path: queryPath,
    openModal,
    closeModal,
    queryName,
    parentName
  };
};

export const modal = ({
  name
}) => {
  const options = buildOptions({
    name
  });
  const MODAL_DATA_QUERY = getModalDataQuery(options);
  const OPEN_MODAL_MUTATION = getOpenModalMutation(options);
  const CLOSE_MODAL_MUTATION = getCloseModalMutation(options);
  const Wrapper = adopt({
    props: ({
      itemId,
      render
    }) => React.createElement(Value, {
      initial: {
        itemId
      }
    }, ({
      value
    }) => render(value)),
    close: ({
      render
    }) => React.createElement(Mutation, {
      mutation: CLOSE_MODAL_MUTATION
    }, render),
    open: ({
      itemId,
      render
    }) => React.createElement(Mutation, {
      mutation: OPEN_MODAL_MUTATION,
      variables: {
        itemId: itemId || null
      }
    }, render),
    query: ({
      render
    }) => React.createElement(Query, {
      query: MODAL_DATA_QUERY
    }, render)
  }, ({
    close,
    open,
    props: {
      itemId
    },
    query: {
      error,
      loading,
      data
    }
  }) => {
    if (error) {
      return {
        error
      };
    }

    const modalState = get(data, options.path);
    const visible = modalState.visible && modalState.itemId === itemId;
    return {
      close,
      loading,
      open,
      visible
    };
  });
  return Wrapper;
};
export const typeDefs = ({
  name
}) => {
  const options = buildOptions({
    name
  });
  return `
    type ${options.name} {
      itemId: ID
      visible: Boolean
    }

    extend type ${options.parentName}Page {
      ${MODAL_PROP_NAME}: ${options.name}
    }
  `;
};
export const defaults = ({
  name
}) => {
  const options = buildOptions({
    name
  });
  return {
    [MODAL_PROP_NAME]: {
      __typename: options.name,
      itemId: null,
      visible: false
    }
  };
};
export const resolvers = ({
  name
}) => {
  const options = buildOptions({
    name
  });

  const openModal = (_, {
    itemId
  }, {
    cache
  }) => {
    const query = getModalDataQuery(options);
    const previous = cache.readQuery({
      query
    });
    const data1 = set(previous, [...options.path, 'visible'], true);
    const data = set(data1, [...options.path, 'itemId'], itemId);
    cache.writeData({
      data
    });
    return get(data, [...options.path, 'visible']);
  };

  const closeModal = (_, __, {
    cache
  }) => {
    const query = getModalDataQuery(options);
    const previous = cache.readQuery({
      query
    });
    const data1 = set(previous, [...options.path, 'visible'], false);
    const data = set(data1, [...options.path, 'itemId'], null);
    cache.writeData({
      data
    });
    return get(data, [...options.path, 'visible']);
  };

  return {
    [options.openModal]: openModal,
    [options.closeModal]: closeModal
  };
};