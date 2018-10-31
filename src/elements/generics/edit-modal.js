// @flow
import {
  modal,
  typeDefs as modalTypeDefs,
  defaults as modalDefaults,
  resolvers as modalResolvers,
} from '../itemModal';

export default ({ page }) => {
  const options = {
    name: `${page}$Edit`,
  };

  const Modal = modal(options);
  const typeDefs = modalTypeDefs(options);
  const defaults = modalDefaults(options);
  const resolvers = modalResolvers(options);

  return {
    Modal,
    typeDefs,
    defaults,
    resolvers,
  };
};
