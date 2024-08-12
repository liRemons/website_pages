import React from 'react';
import AddFieldForm from './addFieldForm';
import { statusKey } from '../model/const';

export default class AddPlantForm extends React.Component {
    render () {
        return <AddFieldForm {...this.props} label="状态" type="status" localStorageKey={statusKey} />
    }
}