import React from 'react';
import { SearchInputTooltip } from './SearchInputTooltip';

export const SelectInput = ({ input, params, onChangeHandler }) => (
  <div key={`${input.id}`} className="row">
    <label title={input.label()}>{input.label()}</label>
    <div>
      <select
        className="dropdown"
        value={params[input.id]}
        onChange={(e) => onChangeHandler(input.id, e.target.value)}
      >
        {!!input.nullValues && <option value="">{input.nullValueLabel ? input.nullValueLabel : ''}</option>}

        {input.options &&
          Array.isArray(input.options) &&
          input.options
            .filter((option) => {
              return input.filterOptions ? input.filterOptions(option, params) : true;
            })
            .map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
      </select>
      <SearchInputTooltip inputId={input.id} />
    </div>
  </div>
);
