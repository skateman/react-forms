import React from 'react';
import PropTypes from 'prop-types';
import { Button as PFButton } from 'patternfly-react';

export const Button = ({ label, variant, dataType, validate, children, component, ...rest }) => (
  <PFButton bsStyle={variant} {...rest}>
    {label || children}
  </PFButton>
);

Button.propTypes = {
  label: PropTypes.node,
  variant: PropTypes.string,
  className: PropTypes.string,
  dataType: PropTypes.any, // should be inside inner props or something
  validate: PropTypes.any, // should be inside inner props or something
  children: PropTypes.any,
  component: PropTypes.any
};

export default Button;
