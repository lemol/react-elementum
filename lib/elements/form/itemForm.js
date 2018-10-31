import React from 'react';
import gql from 'graphql-tag';
import { lowerFirst, mapValues, get, isArray, findKey, values } from 'lodash';
import { Query } from 'react-apollo';
import { adopt } from 'react-adopt';
import { Value } from 'react-powerplug';

const foldMaps = fields => item => item && mapValues(fields, ({
  map
}, field) => map ? map(item) : item[field]);

export const getItemQuery = ({
  name,
  queryName,
  queryFields
}) => gql`
  query ${queryName}($id: ID!) {
    ${name}(id: $id) {
      ${queryFields}
    }
  }
`;

const asNull = (_, onChange) => ({
  render
}) => render({
  onChange
});

const asArray = ({
  source
}, onChange) => ({
  render
}) => React.createElement(Value, {
  initial: source
}, ({
  value
}) => render({
  items: value,
  loading: false,
  onChange,
  refetch: () => source
}));

const asQuery = ({
  source: {
    getVariables,
    query
  }
}, onChange) => ({
  item,
  render
}) => {
  const variables = getVariables && getVariables(item || {});
  return React.createElement(Query, {
    query: query,
    variables: variables
  }, ({
    data,
    loading,
    error,
    refetch
  }) => render({
    items: get(data, findKey(data)),
    loading,
    refetch,
    error,
    getVariables,
    onChange
  }));
};

const buildOnChange = ({
  onChange
}) => {
  if (!onChange) {
    return () => undefined;
  }

  const xs = mapValues(onChange, (val, key) => {
    if (key === 'refetch') {
      return val.map(({
        field,
        clear
      }) => fields => (change, form) => {
        const variables = fields[field].getVariables && fields[field].getVariables(change);
        fields[field].refetch(variables);

        if (clear) {
          form.setFieldValue(field, null);
        }
      });
    }

    return null;
  });
  const xsValues = [...new Set([].concat(...values(xs)))];
  return fields => (change, form) => xsValues.forEach(f => f(fields)(change, form));
};

const fieldSourceMap = field => {
  const onChange = buildOnChange(field);

  if (!field.source) {
    return asNull(field, onChange);
  }

  if (isArray(field.source)) {
    return asArray(field, onChange);
  }

  if (field.source.query) {
    return asQuery(field, onChange);
  }

  return null;
};

const getFieldsSources = fields => mapValues(fields, fieldSourceMap);

const buildOptions = ({
  typeName,
  queryFields
}) => {
  const name = lowerFirst(typeName);
  const queryName = `Get${typeName}`;
  return {
    name,
    typeName,
    queryName,
    queryFields
  };
};

export default (({
  typeName,
  queryFields,
  fields: fieldsOption,
  errorNotification,
  onError
}) => {
  const options = buildOptions({
    typeName,
    queryFields
  });
  const ITEM_QUERY = getItemQuery(options);
  const fieldSources = getFieldsSources(fieldsOption);
  const mapItem = foldMaps(fieldsOption);
  const BagWrapper = adopt({
    _: ({
      render
    }) => render(),
    ...fieldSources
  }, ({
    _,
    ...rest
  }) => rest);
  const Wrapper = adopt({
    props: ({
      itemId,
      bag,
      render
    }) => React.createElement(Value, {
      initial: {
        itemId,
        bag
      }
    }, ({
      value
    }) => render(value)),
    itemQuery: ({
      itemId,
      render
    }) => itemId ? React.createElement(Query, {
      query: ITEM_QUERY,
      variables: {
        id: itemId
      }
    }, render) : render({}),
    fields: ({
      itemQuery: {
        data
      },
      render
    }) => {
      const item = mapItem(get(data, options.name));
      return React.createElement(BagWrapper, {
        item: item
      }, render);
    }
  }, ({
    props: {
      itemId,
      bag
    },
    itemQuery: {
      error: itemQueryError,
      loading,
      data
    },
    fields
  }) => {
    let error = null;
    const itemResult = data && get(data, options.name);
    const item = mapItem(itemResult);

    if (loading) {
      return {
        loading,
        item
      };
    }

    if (itemQueryError) {
      error = { ...(error || {}),
        itemQueryError
      };
    }

    if (error && onError) {
      if (errorNotification) {
        errorNotification('Erro ao tentar obter o item.');
      }

      onError({
        error,
        itemId,
        bag
      });
      return {
        error
      };
    }

    const newFields = mapValues(fields, val => ({ ...val,
      onChange: val.onChange && val.onChange(fields)
    }));
    return {
      loading,
      item,
      error,
      bag,
      fields: newFields
    };
  });
  return Wrapper;
});