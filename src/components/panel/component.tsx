import * as React from 'react';
import {
  BBButton,
  BBBToggle,
  BBBTypography,
  BBBDivider,
} from 'bbb-ui-components-react';
import { PanelProps } from './types';
import Styled from './styles';
import { intlMessages } from '../../intlMessages';
import { usePanelImageUrl } from '../../context/settings/context';

function Panel({
  intl,
  isActive,
  currentStartFromNow,
  syncedStartFromNow,
  onStartStop,
  onSettingsChange,
  currentUser,
}: PanelProps): JSX.Element {
  const panelImageUrl = usePanelImageUrl();

  // Use synced value when not active, otherwise use the value from when it was started
  const startFromNow = isActive ? (currentStartFromNow ?? false) : (syncedStartFromNow ?? false);

  const handleToggleChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onSettingsChange({ startFromNow: checked });
  };

  const handleStart = () => {
    const payload = {
      message: 'start' as const,
      startFromNow,
    };
    onStartStop(payload);
  };

  const handleStop = () => {
    onStartStop({ message: 'stop' });
  };

  const renderModeratorContent = () => {
    const isModeratorOrPresenter = currentUser?.role === 'MODERATOR' || currentUser?.presenter;

    if (!isModeratorOrPresenter) {
      return (
        <Styled.Section>
          <Styled.AttendeeContent>
            {panelImageUrl && (
              <Styled.AnimationContainer>
                <img src={panelImageUrl} alt="Word Cloud Animation" />
              </Styled.AnimationContainer>
            )}
            <BBBTypography variant="default">
              {intl.formatMessage(intlMessages.descriptionAttendee)}
            </BBBTypography>
          </Styled.AttendeeContent>
        </Styled.Section>
      );
    }

    return (
      <Styled.Section>
        <Styled.SectionContent>
          {panelImageUrl && (
            <Styled.AnimationContainer>
              <img src={panelImageUrl} alt="Word Cloud Animation" />
            </Styled.AnimationContainer>
          )}
          <BBBTypography variant="default">
            {intl.formatMessage(intlMessages.description)}
          </BBBTypography>

          <Styled.ToggleContainer>
            <BBBToggle
              label={intl.formatMessage(intlMessages.startFromNow)}
              textPosition="right"
              onChange={handleToggleChange}
              checked={startFromNow}
              disabled={isActive}
              ariaLabel={intl.formatMessage(intlMessages.startFromNow)}
            />
          </Styled.ToggleContainer>

          <Styled.ButtonsContainer>
            <BBBDivider />
            <BBButton
              label={intl.formatMessage(intlMessages.startButton)}
              variant="primary"
              color="default"
              onClick={handleStart}
              disabled={isActive}
            />
            <BBButton
              label={intl.formatMessage(intlMessages.stopButton)}
              variant="primary"
              color="danger"
              onClick={handleStop}
              disabled={!isActive}
            />
          </Styled.ButtonsContainer>
        </Styled.SectionContent>
      </Styled.Section>
    );
  };

  return (
    <Styled.Container>
      {renderModeratorContent()}
    </Styled.Container>
  );
}

export default Panel;
