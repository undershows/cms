import * as React from 'react';
import { Field, TextInput } from '@strapi/design-system';
import { useField, useForm } from '@strapi/strapi/admin';
import { findUf } from '../utils/cityToUf';

// Campo de texto para a cidade que, ao reconhecer uma capital ou nome de
// estado, seleciona a UF correspondente no campo "state" do mesmo formulário.
const CityInput = React.forwardRef((props, ref) => {
  const { hint, disabled, labelAction, label, name, required, placeholder } = props;
  const field = useField(name);
  const onFormChange = useForm('CityInput', (state) => state.onChange);

  const handleChange = (event) => {
    field.onChange(event);
    const uf = findUf(event.target.value);
    if (uf) {
      onFormChange('state', uf);
    }
  };

  return (
    <Field.Root error={field.error} name={name} hint={hint} required={required}>
      <Field.Label action={labelAction}>{label}</Field.Label>
      <TextInput
        ref={ref}
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        value={field.value ?? ''}
        onChange={handleChange}
      />
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
});

export default CityInput;
