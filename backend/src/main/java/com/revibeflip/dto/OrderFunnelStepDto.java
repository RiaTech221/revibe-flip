package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderFunnelStepDto {
    private String status;
    private String label;
    private long count;
    private double percentage;

    public OrderFunnelStepDto(String status, String label, long count, int percentage) {
        this.status = status;
        this.label = label;
        this.count = count;
        this.percentage = percentage;
    }
}
