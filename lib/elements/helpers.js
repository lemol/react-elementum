// @flow
import gql from 'graphql-tag';
import { join, drop } from 'lodash';
const PLACEHOLDER = '[%?%]';
export const buildQuery = ({
  path,
  fields
}) => path.reduce((acc, act) => acc.replace(PLACEHOLDER, `${act} { ${PLACEHOLDER} }`), PLACEHOLDER).replace(PLACEHOLDER, join(fields, ' '));
export const getItemQuery = ({
  path,
  queryName,
  fields
}) => gql`
  query ${queryName}($id: ID!) {
    ${path[0]}(id: $id) {
      ${buildQuery({
  path: drop(path, 1),
  fields
})}
    }
  }
`;