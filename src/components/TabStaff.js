import React, { Component } from 'react';

import TabNote from './TabNote';
import Bars from './Bars';
import Rest from './Rest';
import Clef from './Clef';
import TimeSignature from './TimeSignature';

export default class TabStaff extends Component {
  renderBars = (x, measureWidth, measureIndex) => {
    let color = measureIndex === this.props.currentNote.measure && this.props.isPlaying ? '#267754' : '#999999';
    let strokeWidth = measureIndex === this.props.currentNote.measure && this.props.isPlaying ? '1' : '0.1';

    return <Bars x={x} measureWidth={measureWidth} color={color} strokeWidth={strokeWidth} />;
  }

  renderMeasure = (measureIndex, measureWidth, measure, x) => {
    return (
      <g>
        { this.renderBars(x, measureWidth, measureIndex) }
        {
          measure.notes.map((note, noteIndex) => this.renderNote(note, measureIndex, noteIndex, measureWidth, x, measure.timeSignature))
        }
      </g>
    );
  }

  renderNote = (note, measureIndex, index, measureWidth, xOfMeasure, timeSignature) => {
    let x = xOfMeasure + (index * 55 + 40);
    if(measureIndex === 0) {
      x += 15;
    }
    if(timeSignature) {
      x += 20;
    }

    let { currentNote, isPlaying } = this.props;

    let color = 'black';
    if(currentNote.measure === measureIndex && currentNote.noteIndex === index && isPlaying) {
      color = '#f9423a';
    }

    if(note.string[0] === 'rest') {
      return <Rest key={index} color={color} x={x} y={0} duration={note.duration[0]} />;
    }

    return note.string.map((bleh, j) => {
      let y = 80 - (13 * note.string[j]);

      return <TabNote key={j} x={x} y={y} color={color} fret={note.fret[j]} />;
    });
  }

  convertSongIntoRows = (song) => {
    const screenWidth = window.innerWidth;

    return song.reduce((rows, measure, index) => {
      let notes = measure.notes.length;

      let currentRow = rows[rows.length - 1];
      let currentRowWidth = currentRow.reduce((next, curr) => {
        return next + curr.width;
      }, 0);

      let returnedRows = rows;
      if(currentRowWidth + (60 * measure.notes.length) > screenWidth - 20) {
        if(index !== song.length - 1) {
          returnedRows.push([measure]);
        }
      } else {
        let nextRow = currentRow.concat(measure);

        returnedRows[rows.length - 1] = nextRow;
      }

      return returnedRows;
    }, [[]]);
  }

  getXCoordOfMeasure = (row, index) => {
    if(index === 0) {
      return 0;
    }
    let precedingMeasures = row.slice(0, index);
    return precedingMeasures.reduce((next, curr) => {
      return next + curr.width;
    }, 0);
  }

  getYCoordOfRow = (rowIndex) => {
    return 170 * rowIndex;
  }

  computeMeasureWidths = (song) => {
    return song.map((measure, index) => {
      let width = 60 * measure.notes.length;
      if(index === 0) {
        width += 15;
      }

      let prevMeasure = song[index-1];
      if(prevMeasure && prevMeasure.timeSignature === measure.timeSignature) {
        return {
          notes: measure.notes,
          width
        };
      }
      width += 20;

      return {
        ...measure,
        width
      };
    });
  }

  getMeasureCountUpToRow = (rowIndex) => {
    let measuresWithWidths = this.computeMeasureWidths(this.props.song);
    let rows = this.convertSongIntoRows(measuresWithWidths);

    return rows.reduce((next, curr, i) => {
      if(i < rowIndex) {
        return next + curr.length;
      } else {
        return next;
      }
    }, 0);
  }

  renderMeasureForRow = (row, measureIndex, rowIndex, y, totalMeasureIndex) => {
    let measure = row[measureIndex];
    let x = this.getXCoordOfMeasure(row, measureIndex);

    return (
      <svg key={measureIndex} x={0} y={y} style={{ height: 250, width: measure.width }}>
        { this.renderMeasure(totalMeasureIndex, measure.width, measure, x) }
        { totalMeasureIndex === 0 ? <Clef /> : null }
        { this.renderTimeSignature(totalMeasureIndex, x, measure) }
      </svg>
    );
  }

  renderTimeSignature = (totalMeasureIndex, x, measure) => {
    x = totalMeasureIndex === 0 ? x + 36 : x + 20;
    let { timeSignature } = measure;

    return timeSignature ? <TimeSignature x={x} numerator={timeSignature[0]} denominator={timeSignature[2]} /> : null;
  }

  renderRow = (row, rowIndex) => {
    let y = this.getYCoordOfRow(rowIndex);
    let totalMeasureIndex = this.getMeasureCountUpToRow(rowIndex);

    return row.map((measure, measureIndex) => {
        return this.renderMeasureForRow(row, measureIndex, rowIndex, y, totalMeasureIndex + measureIndex);
    });
  }

  render() {
    let measuresWithWidths = this.computeMeasureWidths(this.props.song);
    let rows = this.convertSongIntoRows(measuresWithWidths);

    return (
      <svg style={{ width: '100%', height: '100%' }}>
        { rows.map(this.renderRow) }
      </svg>
    );
  }
}
