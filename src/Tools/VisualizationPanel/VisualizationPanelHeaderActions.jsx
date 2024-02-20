import React from 'react';
import { t } from 'ttag';

import SocialShare from '../../components/SocialShare/SocialShare';

export const VisualizationPanelHeaderActions = ({
  onZoomToTile,
  onSavePin,
  displayZoomToTile,
  isSelectedLayerVisible,
  toggleVisible,
  showEffects,
  toggleValue,
  addVisualizationToCompare,
  toggleSocialSharePanel,
  displaySocialShareOptions,
  datasetId,
  is3D,
  haveEffectsChanged,
}) => {
  const showEffectText = t`Show effects and advanced options`;
  const showVisualizationText = t`Show visualization`;
  const actions = [
    {
      id: 'savePin',
      title: () => t`Add to Pins`,
      onClick: () => onSavePin(),
      icon: () => 'fa fa-thumb-tack',
      visible: () => true,
      showBadge: () => false,
    },
    {
      id: 'showEffects',
      title: () => (showEffects ? showVisualizationText : showEffectText),
      onClick: () => toggleValue('showEffects'),
      icon: () => `fa fa-${showEffects ? 'paint-brush' : 'sliders'}`,
      visible: () => true,
      showBadge: () => !showEffects && haveEffectsChanged,
    },
    {
      id: 'addToCompare',
      title: () => t`Add to compare`,
      onClick: () => addVisualizationToCompare(),
      icon: () => 'fas fa-exchange-alt',
      visible: () => !is3D,
      showBadge: () => false,
    },
    {
      id: 'zoom',
      title: () => t`Zoom to tile`,
      onClick: () => onZoomToTile(),
      icon: () => 'fa fa-crosshairs',
      visible: () => displayZoomToTile,
      showBadge: () => false,
    },
    {
      id: 'showLayer',
      title: () => (isSelectedLayerVisible ? t`Hide layer` : t`Show layer`),
      onClick: () => toggleVisible(),
      icon: () => `fa fa-eye${isSelectedLayerVisible ? '-slash' : ''}`,
      visible: () => !is3D,
      showBadge: () => false,
    },
    {
      id: 'socialShare',
      title: () => t`Share`,
      onClick: () => toggleSocialSharePanel(),
      icon: () => 'fas fa-share-alt',
      visible: () => true,
      showBadge: () => false,
    },
  ];

  return (
    <div className="actions">
      {actions
        .filter((action) => action.visible())
        .map((action) => (
          <div className="action-wrapper" key={action.id} onClick={action.onClick} title={action.title()}>
            <i className={action.icon()} />
            {action.showBadge() && <div className="effects-badge" />}
          </div>
        ))}
      <SocialShare
        displaySocialShareOptions={displaySocialShareOptions}
        toggleSocialSharePanel={toggleSocialSharePanel}
        datasetId={datasetId}
      />
    </div>
  );
};
