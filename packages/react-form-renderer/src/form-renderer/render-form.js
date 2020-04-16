import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { childrenPropTypes } from '@data-driven-forms/common/src/prop-types-templates';
import { dataTypeValidator } from '../validators';
import RendererContext from '../files/renderer-context';
import Condition from './condition';
import { memoize } from '../validators/helpers';
import componentTypes from '../files/component-types';
import composeValidators from '../files/compose-validators';
import convertInitialValue from './convert-initial-value';
import FormSpy from '../files/form-spy';

const assignSpecialType = (componentType) => ([componentTypes.CHECKBOX, componentTypes.RADIO].includes(componentType) ? componentType : undefined);

const FormFieldHideWrapper = ({ hideField, children }) => (hideField ? <div hidden>{children}</div> : children);

FormFieldHideWrapper.propTypes = {
  hideField: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired
};

FormFieldHideWrapper.defaultProps = {
  hideField: false
};

const FormConditionWrapper = ({ condition, children }) =>
  condition ? (
    <FormSpy>
      {({ values }) => (
        <Condition condition={condition} values={values}>
          {children}
        </Condition>
      )}
    </FormSpy>
  ) : (
    children
  );

FormConditionWrapper.propTypes = {
  condition: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: childrenPropTypes.isRequired
};

const prepareValidator = (validator, mapper) => (typeof validator === 'function' ? memoize(validator) : mapper[validator.type]({ ...validator }));

const getValidate = (validate, dataType, mapper) => [
  ...(validate ? validate.map((validator) => prepareValidator(validator, mapper)) : []),
  ...(dataType ? [dataTypeValidator(dataType)()] : [])
];

const prepareArrayValidator = (validation) => (value = []) => {
  if (!Array.isArray(value)) {
    return;
  }

  const arrayValidator = composeValidators(validation);
  let result = arrayValidator(value && value.length > 0 ? value : undefined);
  if (typeof result === 'function') {
    result = result(value);
  }

  return result;
};

const SingleField = ({ component, condition, hideField, validate, ...rest }) => {
  const { componentMapper, validatorMapper } = useContext(RendererContext);

  const validation = validate || rest.dataType ? getValidate(validate, rest.dataType, validatorMapper) : undefined;

  const componentProps = {
    type: assignSpecialType(component),
    ...rest,
    ...(Object.prototype.hasOwnProperty.call(rest, 'initialValue') && Object.prototype.hasOwnProperty.call(rest, 'dataType')
      ? { initialValue: convertInitialValue(rest.initialValue, rest.dataType) }
      : {}),
    ...(validation
      ? componentTypes.FIELD_ARRAY === component
        ? { arrayValidator: prepareArrayValidator(validation) }
        : { validate: composeValidators(validation) }
      : {})
  };

  const Component = componentMapper[component];

  return (
    <FormConditionWrapper condition={condition}>
      <FormFieldHideWrapper hideField={hideField}>
        <Component {...componentProps} />
      </FormFieldHideWrapper>
    </FormConditionWrapper>
  );
};

SingleField.propTypes = {
  component: PropTypes.string.isRequired,
  condition: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  hideField: PropTypes.bool,
  dataType: PropTypes.string,
  validate: PropTypes.arrayOf(PropTypes.func),
  initialValue: PropTypes.any
};

const renderForm = (fields) => fields.map((field) => (Array.isArray(field) ? renderForm(field) : <SingleField key={field.name} {...field} />));

export default renderForm;
