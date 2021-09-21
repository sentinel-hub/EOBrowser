import React from 'react';

export const SelectInput = ({ input, params, onChangeHandler }) => (
  <div key={`${input.id}`} className="row">
    <label title={input.label()}>{input.label()}</label>
    <select
      className="dropdown"
      value={params[input.id]}
      onChange={(e) => onChangeHandler(input.id, e.target.value)}
    >
      {!!input.nullValues && <option value="">{input.nullValueLabel ? input.nullValueLabel : ''}</option>}

      {Object.keys(input.options).map((option, index) => (
        <option key={index} value={input.options[option].value}>
          {input.options[option].label}
        </option>
      ))}
    </select>
  </div>
);
